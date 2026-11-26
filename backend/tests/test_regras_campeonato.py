from datetime import date, datetime, time, timedelta

import pytest
from fastapi import HTTPException

from app.models.campeonato import Campeonato
from app.models.partida import Partida
from app.models.time import Time
from app.models.usuario import Usuario
from app.schemas.campeonato import CampeonatoUpdate
from app.services import campeonato_service

INICIO = date.today() - timedelta(days=10)


@pytest.fixture
def c(db):
    """Campeonato com os times A e B e uma partida agendada 2 dias depois do início."""
    usuario = Usuario(nome="Org", email="org@teste.com", senha_hash="x")
    db.add(usuario)
    db.commit()
    campeonato = Campeonato(nome="Copa", data_inicio=INICIO, organizador_id=usuario.id)
    db.add(campeonato)
    db.commit()
    times = []
    for nome in "AB":
        t = Time(nome=nome, campeonato_id=campeonato.id)
        db.add(t)
        db.commit()
        times.append(t)
    partida = Partida(
        data_hora=datetime.combine(INICIO + timedelta(days=2), time(15, 0)),
        local="Quadra",
        campeonato_id=campeonato.id,
        time_mandante_id=times[0].id,
        time_visitante_id=times[1].id,
    )
    db.add(partida)
    db.commit()
    return {"usuario": usuario, "campeonato": campeonato, "partida": partida}


def editar(db, c, **campos):
    return campeonato_service.editar(db, c["campeonato"].id, c["usuario"].id, CampeonatoUpdate(**campos))


def test_nao_muda_inicio_para_depois_de_partidas(db, c):
    with pytest.raises(HTTPException) as erro:
        editar(db, c, data_inicio=INICIO + timedelta(days=5))
    assert "partidas antes dessa data" in erro.value.detail
    db.refresh(c["campeonato"])
    assert c["campeonato"].data_inicio == INICIO


def test_muda_inicio_sem_deixar_partida_para_tras(db, c):
    # o dia da partida ainda vale: ela fica exatamente no início
    campeonato = editar(db, c, data_inicio=INICIO + timedelta(days=2))
    assert campeonato.data_inicio == INICIO + timedelta(days=2)


def test_nao_encerra_com_partida_pendente(db, c):
    with pytest.raises(HTTPException) as erro:
        campeonato_service.encerrar(db, c["campeonato"].id, c["usuario"].id)
    assert "partidas pendentes" in erro.value.detail
    # pelo PUT também não passa
    with pytest.raises(HTTPException):
        editar(db, c, encerrado=True)
    db.refresh(c["campeonato"])
    assert c["campeonato"].encerrado is False


def test_encerra_com_todas_as_partidas_finalizadas(db, c):
    c["partida"].finalizada = True
    db.commit()
    campeonato = campeonato_service.encerrar(db, c["campeonato"].id, c["usuario"].id)
    assert campeonato.encerrado is True


def test_reabre_campeonato_encerrado(db, c):
    c["partida"].finalizada = True
    c["campeonato"].encerrado = True
    db.commit()
    assert editar(db, c, encerrado=False).encerrado is False
