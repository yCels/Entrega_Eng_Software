import pytest
from fastapi import HTTPException

from app.core.transacao import salvar
from app.models.usuario import Usuario


def test_salvar_grava_quando_nao_ha_erro(db):
    db.add(Usuario(nome="A", email="a@teste.com", senha_hash="x"))
    salvar(db)

    assert db.query(Usuario).count() == 1


def test_violacao_de_unique_faz_rollback_e_responde_400(db):
    db.add(Usuario(nome="A", email="a@teste.com", senha_hash="x"))
    salvar(db)

    # grava direto, sem passar pela checagem do service: quem barra é a UNIQUE do banco
    db.add(Usuario(nome="B", email="a@teste.com", senha_hash="y"))
    with pytest.raises(HTTPException) as erro:
        salvar(db, "Email já cadastrado")

    assert erro.value.status_code == 400
    assert erro.value.detail == "Email já cadastrado"
    # depois do rollback a sessão continua utilizável e nada da operação ficou gravado
    assert db.query(Usuario).count() == 1
    db.add(Usuario(nome="C", email="c@teste.com", senha_hash="z"))
    salvar(db)
    assert db.query(Usuario).count() == 2


def test_rollback_desfaz_a_operacao_inteira(db):
    # duas inserções na mesma transação: se uma falha, nenhuma é gravada
    db.add(Usuario(nome="A", email="a@teste.com", senha_hash="x"))
    salvar(db)

    db.add(Usuario(nome="Nova", email="nova@teste.com", senha_hash="x"))
    db.add(Usuario(nome="Duplicada", email="a@teste.com", senha_hash="x"))
    with pytest.raises(HTTPException):
        salvar(db)

    assert db.query(Usuario).filter(Usuario.email == "nova@teste.com").count() == 0
