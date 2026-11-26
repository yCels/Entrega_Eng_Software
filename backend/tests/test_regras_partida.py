from datetime import date, datetime, time, timedelta

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.campeonato import Campeonato
from app.models.evento_partida import EventoPartida, TipoEvento
from app.models.jogador import Jogador
from app.models.partida import Partida
from app.models.time import Time
from app.models.usuario import Usuario
from app.schemas.calendario import CalendarioCreate
from app.schemas.evento_partida import EventoPartidaCreate
from app.schemas.partida import PartidaCreate, PartidaUpdate
from app.services import calendario_service, evento_service, partida_service

INICIO = date.today() - timedelta(days=10)
ONTEM = datetime.combine(date.today() - timedelta(days=1), time(15, 0))
SEMANA_QUE_VEM = datetime.combine(date.today() + timedelta(days=7), time(15, 0))


@pytest.fixture
def c(db):
    """Campeonato que começou há 10 dias, com os times A e B e um jogador em cada."""
    usuario = Usuario(nome="Org", email="org@teste.com", senha_hash="x")
    db.add(usuario)
    db.commit()
    campeonato = Campeonato(nome="Copa", data_inicio=INICIO, organizador_id=usuario.id)
    db.add(campeonato)
    db.commit()
    times, jogadores = {}, {}
    for nome in "AB":
        t = Time(nome=nome, campeonato_id=campeonato.id)
        db.add(t)
        db.commit()
        jogador = Jogador(nome=f"Jogador {nome}", time_id=t.id)
        db.add(jogador)
        db.commit()
        times[nome], jogadores[nome] = t, jogador
    return {"usuario": usuario, "campeonato": campeonato, "times": times, "jogadores": jogadores}


def nova_partida(db, c, data_hora):
    partida = Partida(
        data_hora=data_hora,
        local="Quadra",
        campeonato_id=c["campeonato"].id,
        time_mandante_id=c["times"]["A"].id,
        time_visitante_id=c["times"]["B"].id,
    )
    db.add(partida)
    db.commit()
    return partida


def dados_partida(c, data_hora):
    return PartidaCreate(
        data_hora=data_hora,
        local="Quadra",
        time_mandante_id=c["times"]["A"].id,
        time_visitante_id=c["times"]["B"].id,
    )


def gol(c, minuto=10):
    return EventoPartidaCreate(
        jogador_id=c["jogadores"]["A"].id, time_id=c["times"]["A"].id, tipo=TipoEvento.GOL, minuto=minuto
    )


def test_nao_agenda_partida_antes_do_inicio(db, c):
    antes = datetime.combine(INICIO - timedelta(days=1), time(15, 0))
    with pytest.raises(HTTPException) as erro:
        partida_service.agendar(db, c["campeonato"].id, dados_partida(c, antes), c["usuario"].id)
    assert "antes do início" in erro.value.detail


def test_agenda_partida_no_dia_do_inicio(db, c):
    no_inicio = datetime.combine(INICIO, time(9, 0))
    partida = partida_service.agendar(db, c["campeonato"].id, dados_partida(c, no_inicio), c["usuario"].id)
    assert partida.id is not None


def test_nao_remarca_partida_para_antes_do_inicio(db, c):
    partida = nova_partida(db, c, ONTEM)
    antes = datetime.combine(INICIO - timedelta(days=1), time(15, 0))
    with pytest.raises(HTTPException) as erro:
        partida_service.editar(db, partida.id, PartidaUpdate(data_hora=antes), c["usuario"].id)
    assert "antes do início" in erro.value.detail


def test_nao_gera_calendario_antes_do_inicio(db, c):
    dados = CalendarioCreate(local="Quadra", data_inicio=INICIO - timedelta(days=1))
    with pytest.raises(HTTPException) as erro:
        calendario_service.gerar(db, c["campeonato"].id, dados, c["usuario"].id)
    assert "antes do início" in erro.value.detail
    assert db.query(Partida).count() == 0


def test_nao_lanca_evento_em_partida_que_nao_comecou(db, c):
    partida = nova_partida(db, c, SEMANA_QUE_VEM)
    with pytest.raises(HTTPException) as erro:
        evento_service.registrar(db, partida.id, gol(c), c["usuario"].id)
    assert "não começou" in erro.value.detail


def test_lanca_evento_em_partida_que_ja_comecou(db, c):
    partida = nova_partida(db, c, ONTEM)
    evento = evento_service.registrar(db, partida.id, gol(c), c["usuario"].id)
    assert evento.id is not None


def test_nao_remarca_para_o_futuro_partida_com_eventos(db, c):
    partida = nova_partida(db, c, ONTEM)
    evento_service.registrar(db, partida.id, gol(c), c["usuario"].id)
    with pytest.raises(HTTPException) as erro:
        partida_service.editar(db, partida.id, PartidaUpdate(data_hora=SEMANA_QUE_VEM), c["usuario"].id)
    assert "futuro" in erro.value.detail
    assert db.query(EventoPartida).count() == 1


def test_minuto_do_evento_tem_limite():
    with pytest.raises(ValidationError):
        EventoPartidaCreate(jogador_id=1, time_id=1, tipo=TipoEvento.GOL, minuto=151)
    assert EventoPartidaCreate(jogador_id=1, time_id=1, tipo=TipoEvento.GOL, minuto=150).minuto == 150
