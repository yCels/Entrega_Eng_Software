from datetime import date, datetime, time

import pytest
from fastapi import HTTPException

from app.models.campeonato import Campeonato
from app.models.partida import Partida
from app.models.time import Time
from app.models.usuario import Usuario
from app.schemas.calendario import CalendarioCreate
from app.services import calendario_service

INICIO = date(2026, 3, 1)


def criar_campeonato(db, quantidade_times, email="org@teste.com", encerrado=False):
    usuario = Usuario(nome="Org", email=email, senha_hash="x")
    db.add(usuario)
    db.commit()
    campeonato = Campeonato(
        nome="Copa", data_inicio=INICIO, organizador_id=usuario.id, encerrado=encerrado
    )
    db.add(campeonato)
    db.commit()
    for i in range(quantidade_times):
        db.add(Time(nome=f"Time {i + 1}", campeonato_id=campeonato.id))
    db.commit()
    return usuario, campeonato


def dados(**extra):
    return CalendarioCreate(local="Quadra Central", **extra)


def test_gera_e_grava_todas_as_partidas(db):
    usuario, campeonato = criar_campeonato(db, 4)

    partidas = calendario_service.gerar(db, campeonato.id, dados(), usuario.id)

    assert len(partidas) == 6
    assert all(p.id is not None and p.campeonato_id == campeonato.id for p in partidas)
    assert db.query(Partida).count() == 6
    # sem data_inicio no corpo, usa a do campeonato
    assert min(p.data_hora for p in partidas) == datetime.combine(INICIO, time(15, 0))


def test_usa_a_data_de_inicio_informada(db):
    usuario, campeonato = criar_campeonato(db, 2)

    partidas = calendario_service.gerar(
        db, campeonato.id, dados(data_inicio=date(2026, 5, 10)), usuario.id
    )

    assert partidas[0].data_hora == datetime(2026, 5, 10, 15, 0)


def test_recusa_campeonato_com_menos_de_dois_times(db):
    usuario, campeonato = criar_campeonato(db, 1)

    with pytest.raises(HTTPException) as erro:
        calendario_service.gerar(db, campeonato.id, dados(), usuario.id)

    assert erro.value.status_code == 400
    assert "2 times" in erro.value.detail


def test_recusa_se_o_campeonato_ja_tem_partidas(db):
    usuario, campeonato = criar_campeonato(db, 4)
    calendario_service.gerar(db, campeonato.id, dados(), usuario.id)

    with pytest.raises(HTTPException) as erro:
        calendario_service.gerar(db, campeonato.id, dados(), usuario.id)

    assert erro.value.status_code == 400
    assert db.query(Partida).count() == 6


def test_recusa_campeonato_encerrado(db):
    usuario, campeonato = criar_campeonato(db, 4, encerrado=True)

    with pytest.raises(HTTPException) as erro:
        calendario_service.gerar(db, campeonato.id, dados(), usuario.id)

    assert erro.value.status_code == 400
    assert db.query(Partida).count() == 0


def test_campeonato_de_outro_organizador_da_404(db):
    _, campeonato = criar_campeonato(db, 4)
    outro = Usuario(nome="Outro", email="outro@teste.com", senha_hash="x")
    db.add(outro)
    db.commit()

    with pytest.raises(HTTPException) as erro:
        calendario_service.gerar(db, campeonato.id, dados(), outro.id)

    assert erro.value.status_code == 404


def test_conflito_com_outro_campeonato_nao_grava_nenhuma_partida(db):
    # outro campeonato já ocupa a quadra no horário do 2º jogo da 1ª rodada
    usuario, campeonato = criar_campeonato(db, 4)
    outro_usuario, outro = criar_campeonato(db, 2, email="outro@teste.com")
    a, b = db.query(Time).filter(Time.campeonato_id == outro.id).all()
    db.add(
        Partida(
            data_hora=datetime(2026, 3, 1, 17, 0),
            local="Quadra Central",
            campeonato_id=outro.id,
            time_mandante_id=a.id,
            time_visitante_id=b.id,
        )
    )
    db.commit()

    with pytest.raises(HTTPException) as erro:
        calendario_service.gerar(db, campeonato.id, dados(), usuario.id)

    assert erro.value.status_code == 400
    assert "horário e local" in erro.value.detail
    # tudo ou nada: nenhuma partida do campeonato foi gravada
    assert db.query(Partida).filter(Partida.campeonato_id == campeonato.id).count() == 0
