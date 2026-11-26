from datetime import date, datetime

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.campeonato import Campeonato
from app.models.evento_partida import EventoPartida, TipoEvento
from app.models.jogador import Jogador
from app.models.partida import Partida
from app.models.time import Time
from app.models.usuario import Usuario
from app.schemas.evento_partida import EventoPartidaCreate
from app.services import evento_service


@pytest.fixture
def cenario(db):
    """Partida A x B; C é um time do campeonato que não joga essa partida."""
    usuario = Usuario(nome="Org", email="org@teste.com", senha_hash="x")
    db.add(usuario)
    db.commit()
    campeonato = Campeonato(nome="Copa", data_inicio=date(2026, 3, 1), organizador_id=usuario.id)
    db.add(campeonato)
    db.commit()

    times, jogadores = {}, {}
    for nome in "ABC":
        time = Time(nome=nome, campeonato_id=campeonato.id)
        db.add(time)
        db.commit()
        jogador = Jogador(nome=f"Jogador {nome}", time_id=time.id)
        db.add(jogador)
        db.commit()
        times[nome], jogadores[nome] = time, jogador

    partida = Partida(
        data_hora=datetime(2026, 3, 1, 15, 0),
        local="Quadra",
        campeonato_id=campeonato.id,
        time_mandante_id=times["A"].id,
        time_visitante_id=times["B"].id,
    )
    db.add(partida)
    db.commit()
    return {"usuario": usuario, "campeonato": campeonato, "partida": partida, "times": times, "jogadores": jogadores}


def registrar(db, c, time="A", jogador=None, tipo=TipoEvento.GOL, minuto=10):
    jogador_id = c["jogadores"][jogador or time].id
    dados = EventoPartidaCreate(jogador_id=jogador_id, time_id=c["times"][time].id, tipo=tipo, minuto=minuto)
    return evento_service.registrar(db, c["partida"].id, dados, c["usuario"].id)


def erro_de(funcao, *args, **kwargs):
    with pytest.raises(HTTPException) as erro:
        funcao(*args, **kwargs)
    return erro.value


def test_registra_gol_e_conta_no_placar(db, cenario):
    registrar(db, cenario, "A")
    registrar(db, cenario, "B", tipo=TipoEvento.CARTAO_AMARELO)

    placar = evento_service.calcular_placar(db, cenario["partida"].id, cenario["usuario"].id)
    assert (placar["gols_mandante"], placar["gols_visitante"]) == (1, 0)


def test_jogador_precisa_ser_do_time_informado(db, cenario):
    # gol "do time A" lançado com o jogador do time B
    erro = erro_de(registrar, db, cenario, time="A", jogador="B")

    assert erro.status_code == 400
    assert "não pertence ao time" in erro.detail
    assert db.query(EventoPartida).count() == 0


def test_jogador_inexistente_da_404(db, cenario):
    dados = EventoPartidaCreate(jogador_id=999, time_id=cenario["times"]["A"].id, tipo=TipoEvento.GOL)

    erro = erro_de(evento_service.registrar, db, cenario["partida"].id, dados, cenario["usuario"].id)
    assert erro.status_code == 404


def test_time_que_nao_joga_a_partida_e_recusado(db, cenario):
    erro = erro_de(registrar, db, cenario, time="C")

    assert erro.status_code == 400
    assert "não participa" in erro.detail


def test_nao_registra_em_campeonato_encerrado(db, cenario):
    cenario["campeonato"].encerrado = True
    db.commit()

    erro = erro_de(registrar, db, cenario, "A")
    assert erro.status_code == 400
    assert "encerrado" in erro.detail


@pytest.mark.parametrize("campos", [{"tipo": "penalti"}, {"tipo": "gol", "minuto": -1}])
def test_schema_recusa_tipo_invalido_e_minuto_negativo(campos):
    with pytest.raises(ValidationError):
        EventoPartidaCreate(jogador_id=1, time_id=1, **campos)


def test_schema_aceita_o_tipo_como_texto():
    # é assim que chega do frontend: {"tipo": "cartao_vermelho"}
    dados = EventoPartidaCreate(jogador_id=1, time_id=1, tipo="cartao_vermelho")
    assert dados.tipo is TipoEvento.CARTAO_VERMELHO


def test_lista_por_minuto_com_sem_minuto_no_fim(db, cenario):
    registrar(db, cenario, "A", minuto=None)
    registrar(db, cenario, "B", minuto=80)
    registrar(db, cenario, "A", minuto=5)

    eventos = evento_service.listar(db, cenario["partida"].id, cenario["usuario"].id)
    assert [e.minuto for e in eventos] == [5, 80, None]


def test_excluir_evento_atualiza_o_placar(db, cenario):
    gol = registrar(db, cenario, "A")
    registrar(db, cenario, "A", minuto=20)

    evento_service.excluir(db, gol.id, cenario["usuario"].id)

    placar = evento_service.calcular_placar(db, cenario["partida"].id, cenario["usuario"].id)
    assert placar["gols_mandante"] == 1


def test_excluir_evento_inexistente_ou_de_outro_organizador_da_404(db, cenario):
    gol = registrar(db, cenario, "A")
    outro = Usuario(nome="Outro", email="outro@teste.com", senha_hash="x")
    db.add(outro)
    db.commit()

    assert erro_de(evento_service.excluir, db, 999, cenario["usuario"].id).status_code == 404
    assert erro_de(evento_service.excluir, db, gol.id, outro.id).status_code == 404
    assert db.query(EventoPartida).count() == 1


def test_nao_exclui_evento_em_campeonato_encerrado(db, cenario):
    gol = registrar(db, cenario, "A")
    cenario["campeonato"].encerrado = True
    db.commit()

    assert erro_de(evento_service.excluir, db, gol.id, cenario["usuario"].id).status_code == 400
    assert db.query(EventoPartida).count() == 1
