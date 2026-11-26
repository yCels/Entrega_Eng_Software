from datetime import date, datetime

import pytest
from fastapi import HTTPException

from app.models.campeonato import Campeonato
from app.models.evento_partida import EventoPartida, TipoEvento
from app.models.jogador import Jogador
from app.models.partida import Partida
from app.models.time import Time
from app.models.usuario import Usuario
from app.schemas.partida import PartidaCreate, PartidaResponse, PartidaUpdate
from app.services import partida_service

DIA = datetime(2026, 3, 1, 15, 0)
OUTRO_DIA = datetime(2026, 3, 8, 15, 0)


@pytest.fixture
def cenario(db):
    """Organizador com um campeonato de 4 times (A, B, C, D)."""
    usuario = Usuario(nome="Org", email="org@teste.com", senha_hash="x")
    db.add(usuario)
    db.commit()
    campeonato = Campeonato(nome="Copa", data_inicio=date(2026, 3, 1), organizador_id=usuario.id)
    db.add(campeonato)
    db.commit()
    times = {}
    for nome in "ABCD":
        time = Time(nome=nome, campeonato_id=campeonato.id)
        db.add(time)
        db.commit()
        times[nome] = time
    return usuario, campeonato, times


def agendar(db, cenario, mandante, visitante, data_hora=DIA, local="Quadra 1"):
    usuario, campeonato, times = cenario
    return partida_service.agendar(
        db,
        campeonato.id,
        PartidaCreate(
            data_hora=data_hora,
            local=local,
            time_mandante_id=times[mandante].id,
            time_visitante_id=times[visitante].id,
        ),
        usuario.id,
    )


def editar(db, cenario, partida, **campos):
    usuario, _, times = cenario
    for lado in ("time_mandante_id", "time_visitante_id"):
        if isinstance(campos.get(lado), str):
            campos[lado] = times[campos[lado]].id
    return partida_service.editar(db, partida.id, PartidaUpdate(**campos), usuario.id)


def erro_de(funcao, *args, **kwargs):
    with pytest.raises(HTTPException) as erro:
        funcao(*args, **kwargs)
    return erro.value


def encerrar(db, cenario):
    cenario[1].encerrado = True
    db.commit()


# ---------- agendar ----------


def test_agenda_e_responde_com_os_nomes_dos_times(db, cenario):
    partida = agendar(db, cenario, "A", "B")

    resposta = PartidaResponse.model_validate(partida)
    assert resposta.time_mandante_nome == "A"
    assert resposta.time_visitante_nome == "B"


def test_nao_agenda_no_mesmo_horario_e_local(db, cenario):
    agendar(db, cenario, "A", "B")

    erro = erro_de(agendar, db, cenario, "C", "D")
    assert erro.status_code == 400
    assert "horário e local" in erro.detail


def test_nao_agenda_time_que_ja_joga_no_horario(db, cenario):
    agendar(db, cenario, "A", "B")

    erro = erro_de(agendar, db, cenario, "A", "C", local="Quadra 2")
    assert erro.status_code == 400
    assert "times já tem partida" in erro.detail


def test_nao_agenda_em_campeonato_encerrado(db, cenario):
    encerrar(db, cenario)

    erro = erro_de(agendar, db, cenario, "A", "B")
    assert erro.status_code == 400
    assert "encerrado" in erro.detail


def test_lista_em_ordem_de_data(db, cenario):
    usuario, campeonato, _ = cenario
    agendar(db, cenario, "C", "D", data_hora=OUTRO_DIA)
    agendar(db, cenario, "A", "B", data_hora=DIA)

    partidas = partida_service.listar(db, campeonato.id, usuario.id)
    assert [p.data_hora for p in partidas] == [DIA, OUTRO_DIA]


# ---------- obter ----------


def test_partida_de_outro_organizador_da_404(db, cenario):
    partida = agendar(db, cenario, "A", "B")
    outro = Usuario(nome="Outro", email="outro@teste.com", senha_hash="x")
    db.add(outro)
    db.commit()

    for funcao, args in [
        (partida_service.obter, (db, partida.id, outro.id)),
        (partida_service.editar, (db, partida.id, PartidaUpdate(local="X"), outro.id)),
        (partida_service.excluir, (db, partida.id, outro.id)),
    ]:
        assert erro_de(funcao, *args).status_code == 404


# ---------- editar ----------


def test_remarca_so_o_que_foi_enviado(db, cenario):
    partida = agendar(db, cenario, "A", "B")

    editada = editar(db, cenario, partida, data_hora=OUTRO_DIA)

    assert editada.data_hora == OUTRO_DIA
    assert editada.local == "Quadra 1"
    assert editada.time_mandante.nome == "A"


def test_editar_sem_mudar_horario_nao_conflita_com_ela_mesma(db, cenario):
    partida = agendar(db, cenario, "A", "B")

    editada = editar(db, cenario, partida, local="Quadra 1", data_hora=DIA)

    assert editada.id == partida.id


def test_campo_enviado_como_null_e_ignorado(db, cenario):
    partida = agendar(db, cenario, "A", "B")

    editada = editar(db, cenario, partida, local=None, data_hora=OUTRO_DIA)

    assert editada.local == "Quadra 1"


def test_nao_remarca_para_horario_e_local_ocupados(db, cenario):
    agendar(db, cenario, "A", "B", data_hora=DIA)
    partida = agendar(db, cenario, "C", "D", data_hora=OUTRO_DIA)

    erro = erro_de(editar, db, cenario, partida, data_hora=DIA)
    assert erro.status_code == 400
    assert db.get(Partida, partida.id).data_hora == OUTRO_DIA


def test_troca_de_times_valida_conflito_de_agenda(db, cenario):
    agendar(db, cenario, "A", "B", data_hora=DIA, local="Quadra 1")
    partida = agendar(db, cenario, "C", "D", data_hora=DIA, local="Quadra 2")

    erro = erro_de(editar, db, cenario, partida, time_mandante_id="A")
    assert erro.status_code == 400
    assert "times já tem partida" in erro.detail


def test_nao_aceita_time_contra_ele_mesmo(db, cenario):
    partida = agendar(db, cenario, "A", "B")

    erro = erro_de(editar, db, cenario, partida, time_visitante_id="A")
    assert erro.status_code == 400


def test_nao_troca_times_se_ja_tem_eventos(db, cenario):
    partida = agendar(db, cenario, "A", "B")
    time_a = cenario[2]["A"]
    jogador = Jogador(nome="Fulano", time_id=time_a.id)
    db.add(jogador)
    db.commit()
    db.add(EventoPartida(tipo=TipoEvento.GOL, partida_id=partida.id, jogador_id=jogador.id, time_id=time_a.id))
    db.commit()

    erro = erro_de(editar, db, cenario, partida, time_visitante_id="C")
    assert erro.status_code == 400
    assert "eventos" in erro.detail
    # mudar só o horário continua permitido
    assert editar(db, cenario, partida, data_hora=OUTRO_DIA).data_hora == OUTRO_DIA


def test_nao_edita_em_campeonato_encerrado(db, cenario):
    partida = agendar(db, cenario, "A", "B")
    encerrar(db, cenario)

    assert erro_de(editar, db, cenario, partida, local="X").status_code == 400


# ---------- excluir ----------


def test_exclui_a_partida_e_os_eventos(db, cenario):
    usuario, _, times = cenario
    partida = agendar(db, cenario, "A", "B")
    jogador = Jogador(nome="Fulano", time_id=times["A"].id)
    db.add(jogador)
    db.commit()
    db.add(EventoPartida(tipo=TipoEvento.GOL, partida_id=partida.id, jogador_id=jogador.id, time_id=times["A"].id))
    db.commit()

    partida_service.excluir(db, partida.id, usuario.id)

    assert db.query(Partida).count() == 0
    assert db.query(EventoPartida).count() == 0


def test_nao_exclui_em_campeonato_encerrado(db, cenario):
    usuario = cenario[0]
    partida = agendar(db, cenario, "A", "B")
    encerrar(db, cenario)

    assert erro_de(partida_service.excluir, db, partida.id, usuario.id).status_code == 400
    assert db.query(Partida).count() == 1
