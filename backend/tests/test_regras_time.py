from datetime import date, datetime

import pytest
from fastapi import HTTPException

from app.models.campeonato import Campeonato
from app.models.jogador import Jogador
from app.models.partida import Partida
from app.models.time import Time
from app.models.usuario import Usuario
from app.schemas.jogador import JogadorCreate, JogadorUpdate
from app.schemas.time import TimeCreate, TimeUpdate
from app.services import jogador_service, time_service


@pytest.fixture
def c(db):
    """Campeonato com os times A e B, ainda sem partidas."""
    usuario = Usuario(nome="Org", email="org@teste.com", senha_hash="x")
    db.add(usuario)
    db.commit()
    campeonato = Campeonato(nome="Copa", data_inicio=date.today(), organizador_id=usuario.id)
    db.add(campeonato)
    db.commit()
    times = {}
    for nome in "AB":
        time = Time(nome=nome, campeonato_id=campeonato.id)
        db.add(time)
        db.commit()
        times[nome] = time
    return {"usuario": usuario, "campeonato": campeonato, "times": times}


def encerrar(db, c):
    c["campeonato"].encerrado = True
    db.commit()


def test_exclui_time_sem_partidas(db, c):
    time_service.excluir(db, c["times"]["A"].id, c["usuario"].id)
    assert db.query(Time).count() == 1


def test_nao_exclui_time_com_partidas(db, c):
    db.add(Partida(
        data_hora=datetime(2026, 12, 1, 15, 0),
        local="Quadra",
        campeonato_id=c["campeonato"].id,
        time_mandante_id=c["times"]["A"].id,
        time_visitante_id=c["times"]["B"].id,
    ))
    db.commit()

    # o B é visitante: a checagem tem que olhar os dois lados
    with pytest.raises(HTTPException) as erro:
        time_service.excluir(db, c["times"]["B"].id, c["usuario"].id)
    assert erro.value.status_code == 400
    assert "partidas" in erro.value.detail
    assert db.query(Time).count() == 2


def test_nao_cria_time_em_campeonato_encerrado(db, c):
    encerrar(db, c)
    with pytest.raises(HTTPException) as erro:
        time_service.criar(db, c["campeonato"].id, TimeCreate(nome="C"), c["usuario"].id)
    assert "encerrado" in erro.value.detail


def test_nao_edita_time_em_campeonato_encerrado(db, c):
    encerrar(db, c)
    with pytest.raises(HTTPException) as erro:
        time_service.editar(db, c["times"]["A"].id, TimeUpdate(nome="Novo"), c["usuario"].id)
    assert "encerrado" in erro.value.detail


def test_nao_exclui_time_em_campeonato_encerrado(db, c):
    encerrar(db, c)
    with pytest.raises(HTTPException) as erro:
        time_service.excluir(db, c["times"]["A"].id, c["usuario"].id)
    assert "encerrado" in erro.value.detail


def test_nao_cadastra_jogador_em_campeonato_encerrado(db, c):
    encerrar(db, c)
    with pytest.raises(HTTPException) as erro:
        jogador_service.criar(db, c["times"]["A"].id, JogadorCreate(nome="Novo"), c["usuario"].id)
    assert "encerrado" in erro.value.detail


def test_nao_edita_jogador_em_campeonato_encerrado(db, c):
    jogador = Jogador(nome="Fulano", time_id=c["times"]["A"].id)
    db.add(jogador)
    db.commit()
    encerrar(db, c)
    with pytest.raises(HTTPException) as erro:
        jogador_service.editar(db, jogador.id, JogadorUpdate(nome="Outro"), c["usuario"].id)
    assert "encerrado" in erro.value.detail


def test_nao_exclui_jogador_em_campeonato_encerrado(db, c):
    jogador = Jogador(nome="Fulano", time_id=c["times"]["A"].id)
    db.add(jogador)
    db.commit()
    encerrar(db, c)
    with pytest.raises(HTTPException) as erro:
        jogador_service.excluir(db, jogador.id, c["usuario"].id)
    assert "encerrado" in erro.value.detail
    assert db.query(Jogador).count() == 1
