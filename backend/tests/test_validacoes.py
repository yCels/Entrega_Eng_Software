from datetime import date

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.campeonato import Campeonato
from app.models.jogador import Jogador
from app.models.time import Time
from app.models.usuario import Usuario
from app.schemas.campeonato import CampeonatoCreate
from app.schemas.jogador import JogadorCreate, JogadorUpdate
from app.schemas.time import TimeCreate, TimeUpdate
from app.schemas.usuario import UsuarioCreate
from app.services import jogador_service, time_service


@pytest.fixture
def c(db):
    """Campeonato com o time "Vila Nova" e um jogador camisa 10."""
    usuario = Usuario(nome="Org", email="org@teste.com", senha_hash="x")
    db.add(usuario)
    db.commit()
    campeonato = Campeonato(nome="Copa", data_inicio=date.today(), organizador_id=usuario.id)
    db.add(campeonato)
    db.commit()
    time = Time(nome="Vila Nova", campeonato_id=campeonato.id)
    db.add(time)
    db.commit()
    jogador = Jogador(nome="Camisa 10", numero_camisa=10, time_id=time.id)
    db.add(jogador)
    db.commit()
    return {"usuario": usuario, "campeonato": campeonato, "time": time, "jogador": jogador}


@pytest.mark.parametrize("nome", ["", "   "])
def test_nome_vazio_e_recusado(nome):
    with pytest.raises(ValidationError):
        CampeonatoCreate(nome=nome, data_inicio=date.today())
    with pytest.raises(ValidationError):
        TimeCreate(nome=nome)
    with pytest.raises(ValidationError):
        UsuarioCreate(nome=nome, email="a@a.com", senha="123456")


def test_nome_longo_demais_e_recusado():
    with pytest.raises(ValidationError):
        CampeonatoCreate(nome="x" * 201, data_inicio=date.today())
    with pytest.raises(ValidationError):
        TimeCreate(nome="x" * 151)


def test_espacos_das_pontas_sao_removidos():
    assert TimeCreate(nome="  Vila Nova  ").nome == "Vila Nova"


def test_senha_precisa_de_6_caracteres():
    with pytest.raises(ValidationError):
        UsuarioCreate(nome="Ana", email="ana@teste.com", senha="12345")
    assert UsuarioCreate(nome="Ana", email="ana@teste.com", senha="123456").senha == "123456"


def test_nao_cria_time_com_nome_repetido(db, c):
    # maiúsculas e minúsculas não fazem diferença
    with pytest.raises(HTTPException) as erro:
        time_service.criar(db, c["campeonato"].id, TimeCreate(nome="vila nova"), c["usuario"].id)
    assert "Já existe um time" in erro.value.detail


def test_nao_renomeia_time_para_nome_de_outro(db, c):
    outro = time_service.criar(db, c["campeonato"].id, TimeCreate(nome="Centro"), c["usuario"].id)
    with pytest.raises(HTTPException):
        time_service.editar(db, outro.id, TimeUpdate(nome="Vila Nova"), c["usuario"].id)
    # salvar o time com o próprio nome continua funcionando
    assert time_service.editar(db, outro.id, TimeUpdate(nome="Centro"), c["usuario"].id).nome == "Centro"


def test_nao_repete_numero_de_camisa_no_time(db, c):
    with pytest.raises(HTTPException) as erro:
        jogador_service.criar(db, c["time"].id, JogadorCreate(nome="Outro", numero_camisa=10), c["usuario"].id)
    assert "camisa 10" in erro.value.detail

    novo = jogador_service.criar(db, c["time"].id, JogadorCreate(nome="Outro", numero_camisa=9), c["usuario"].id)
    with pytest.raises(HTTPException):
        jogador_service.editar(db, novo.id, JogadorUpdate(numero_camisa=10), c["usuario"].id)


def test_jogadores_sem_numero_nao_conflitam(db, c):
    jogador_service.criar(db, c["time"].id, JogadorCreate(nome="Sem número 1"), c["usuario"].id)
    jogador_service.criar(db, c["time"].id, JogadorCreate(nome="Sem número 2"), c["usuario"].id)
    assert db.query(Jogador).count() == 3
