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
from app.schemas.jogador import JogadorCreate, JogadorUpdate
from app.services import jogador_service


@pytest.fixture
def c(db):
    usuario = Usuario(nome="Org", email="org@teste.com", senha_hash="x")
    db.add(usuario)
    db.commit()
    campeonato = Campeonato(nome="Copa", data_inicio=date(2026, 3, 1), organizador_id=usuario.id)
    db.add(campeonato)
    db.commit()
    time = Time(nome="A", campeonato_id=campeonato.id)
    db.add(time)
    db.commit()
    return {"usuario": usuario, "campeonato": campeonato, "time": time}


def criar(db, c, nome, camisa=None, posicao=None):
    dados = JogadorCreate(nome=nome, numero_camisa=camisa, posicao=posicao)
    return jogador_service.criar(db, c["time"].id, dados, c["usuario"].id)


def editar(db, c, jogador, **campos):
    return jogador_service.editar(db, jogador.id, JogadorUpdate(**campos), c["usuario"].id)


def test_lista_pela_camisa_com_sem_numero_no_fim(db, c):
    criar(db, c, "Zé", camisa=None)
    criar(db, c, "Bruno", camisa=10)
    criar(db, c, "Ana", camisa=1)
    criar(db, c, "Carlos", camisa=None)

    jogadores = jogador_service.listar(db, c["time"].id, c["usuario"].id)

    assert [j.nome for j in jogadores] == ["Ana", "Bruno", "Carlos", "Zé"]


def test_editar_muda_so_o_que_foi_enviado(db, c):
    jogador = criar(db, c, "Ana", camisa=7, posicao="Meia")

    editado = editar(db, c, jogador, nome="Ana Paula")

    assert (editado.nome, editado.numero_camisa, editado.posicao) == ("Ana Paula", 7, "Meia")


def test_enviar_null_apaga_camisa_e_posicao(db, c):
    jogador = criar(db, c, "Ana", camisa=7, posicao="Meia")

    editado = editar(db, c, jogador, numero_camisa=None, posicao=None)

    assert editado.numero_camisa is None and editado.posicao is None
    assert editado.nome == "Ana"


def test_nome_nao_pode_ser_apagado(db, c):
    jogador = criar(db, c, "Ana")

    with pytest.raises(HTTPException) as erro:
        editar(db, c, jogador, nome=None)

    assert erro.value.status_code == 400


@pytest.mark.parametrize("campos", [{"nome": ""}, {"nome": "A", "numero_camisa": -1}, {"nome": "A", "posicao": "x" * 51}])
def test_schema_recusa_dados_invalidos(campos):
    with pytest.raises(ValidationError):
        JogadorCreate(**campos)


def test_nao_exclui_jogador_com_eventos(db, c):
    jogador = criar(db, c, "Ana")
    outro = Time(nome="B", campeonato_id=c["campeonato"].id)
    db.add(outro)
    db.commit()
    partida = Partida(
        data_hora=datetime(2026, 3, 1, 15),
        local="Quadra",
        campeonato_id=c["campeonato"].id,
        time_mandante_id=c["time"].id,
        time_visitante_id=outro.id,
    )
    db.add(partida)
    db.commit()
    db.add(EventoPartida(tipo=TipoEvento.GOL, partida_id=partida.id, jogador_id=jogador.id, time_id=c["time"].id))
    db.commit()

    with pytest.raises(HTTPException) as erro:
        jogador_service.excluir(db, jogador.id, c["usuario"].id)

    assert erro.value.status_code == 400
    assert "gols ou cartões" in erro.value.detail
    assert db.query(Jogador).count() == 1


def test_exclui_jogador_sem_eventos(db, c):
    jogador = criar(db, c, "Ana")

    jogador_service.excluir(db, jogador.id, c["usuario"].id)

    assert db.query(Jogador).count() == 0
