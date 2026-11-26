from datetime import date, datetime, timedelta

import pytest
from fastapi import HTTPException

from app.models.campeonato import Campeonato
from app.models.evento_partida import EventoPartida, TipoEvento
from app.models.jogador import Jogador
from app.models.partida import Partida
from app.models.time import Time
from app.models.usuario import Usuario
from app.schemas.evento_partida import EventoPartidaCreate
from app.schemas.partida import PartidaResponse, PartidaUpdate
from app.services import classificacao_service, evento_service, partida_service

ONTEM = datetime.now() - timedelta(days=1)


@pytest.fixture
def c(db):
    """Partida A x B que aconteceu ontem, com um jogador em cada time."""
    usuario = Usuario(nome="Org", email="org@teste.com", senha_hash="x")
    db.add(usuario)
    db.commit()
    # começou há um mês: a partida de ontem fica dentro do campeonato
    campeonato = Campeonato(nome="Copa", data_inicio=date.today() - timedelta(days=30), organizador_id=usuario.id)
    db.add(campeonato)
    db.commit()
    times, jogadores = {}, {}
    for nome in "AB":
        time = Time(nome=nome, campeonato_id=campeonato.id)
        db.add(time)
        db.commit()
        jogador = Jogador(nome=f"Jogador {nome}", time_id=time.id)
        db.add(jogador)
        db.commit()
        times[nome], jogadores[nome] = time, jogador
    partida = Partida(
        data_hora=ONTEM,
        local="Quadra",
        campeonato_id=campeonato.id,
        time_mandante_id=times["A"].id,
        time_visitante_id=times["B"].id,
    )
    db.add(partida)
    db.commit()
    return {"usuario": usuario, "campeonato": campeonato, "partida": partida, "times": times, "jogadores": jogadores}


def gol(db, c, time="A"):
    dados = EventoPartidaCreate(
        jogador_id=c["jogadores"][time].id, time_id=c["times"][time].id, tipo=TipoEvento.GOL
    )
    return evento_service.registrar(db, c["partida"].id, dados, c["usuario"].id)


def finalizar(db, c):
    return partida_service.finalizar(db, c["partida"].id, c["usuario"].id)


def reabrir(db, c):
    return partida_service.reabrir(db, c["partida"].id, c["usuario"].id)


def erro_de(funcao, *args):
    with pytest.raises(HTTPException) as erro:
        funcao(*args)
    return erro.value


def pontos_de_a(db, c):
    tabela = classificacao_service.gerar(db, c["campeonato"].id, c["usuario"].id)
    return next(l for l in tabela if l["time_nome"] == "A")["pontos"]


def test_partida_nasce_aberta(db, c):
    assert c["partida"].finalizada is False
    assert PartidaResponse.model_validate(c["partida"]).finalizada is False


def test_so_conta_na_classificacao_depois_de_finalizada(db, c):
    gol(db, c, "A")
    assert pontos_de_a(db, c) == 0

    finalizar(db, c)
    assert pontos_de_a(db, c) == 3

    reabrir(db, c)
    assert pontos_de_a(db, c) == 0


def test_partida_finalizada_trava_eventos(db, c):
    evento = gol(db, c, "A")
    finalizar(db, c)

    assert erro_de(gol, db, c, "B").status_code == 400
    assert erro_de(evento_service.excluir, db, evento.id, c["usuario"].id).status_code == 400
    assert db.query(EventoPartida).count() == 1


def test_partida_finalizada_nao_pode_ser_remarcada_nem_excluida(db, c):
    finalizar(db, c)
    partida_id, user_id = c["partida"].id, c["usuario"].id

    erro = erro_de(partida_service.editar, db, partida_id, PartidaUpdate(local="Outra"), user_id)
    assert erro.status_code == 400
    assert "Reabra" in erro.detail
    assert erro_de(partida_service.excluir, db, partida_id, user_id).status_code == 400


def test_reabrir_libera_as_alteracoes(db, c):
    finalizar(db, c)
    reabrir(db, c)

    gol(db, c, "B")
    editada = partida_service.editar(db, c["partida"].id, PartidaUpdate(local="Outra"), c["usuario"].id)
    assert editada.local == "Outra"


def test_nao_finaliza_partida_que_ainda_nao_comecou(db, c):
    c["partida"].data_hora = datetime.now() + timedelta(days=1)
    db.commit()

    erro = erro_de(finalizar, db, c)
    assert erro.status_code == 400
    assert "não começou" in erro.detail


def test_nao_finaliza_duas_vezes_nem_reabre_partida_aberta(db, c):
    assert erro_de(reabrir, db, c).status_code == 400
    finalizar(db, c)
    assert erro_de(finalizar, db, c).status_code == 400


def test_campeonato_encerrado_nao_reabre(db, c):
    finalizar(db, c)
    c["campeonato"].encerrado = True
    db.commit()

    assert erro_de(reabrir, db, c).status_code == 400


def test_partida_de_outro_organizador_da_404(db, c):
    outro = Usuario(nome="Outro", email="outro@teste.com", senha_hash="x")
    db.add(outro)
    db.commit()

    assert erro_de(partida_service.finalizar, db, c["partida"].id, outro.id).status_code == 404
    assert erro_de(partida_service.reabrir, db, c["partida"].id, outro.id).status_code == 404
