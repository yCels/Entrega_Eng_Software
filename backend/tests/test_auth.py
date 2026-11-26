import pytest

from app.core.security import criar_token

CONTA = {"nome": "Organizador", "email": "org@teste.com", "senha": "senha123"}


def cadastrar(client, **extra):
    return client.post("/api/auth/cadastro", json={**CONTA, **extra})


def logar(client, email=CONTA["email"], senha=CONTA["senha"]):
    return client.post("/api/auth/login", json={"email": email, "senha": senha})


# ---------- cadastro ----------


def test_cadastro_devolve_o_usuario_sem_a_senha(client):
    resposta = cadastrar(client)

    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["email"] == CONTA["email"] and corpo["nome"] == CONTA["nome"]
    assert "senha" not in corpo and "senha_hash" not in corpo


def test_email_duplicado_da_400(client):
    cadastrar(client)

    resposta = cadastrar(client, nome="Outro")

    assert resposta.status_code == 400
    assert resposta.json()["detail"] == "Email já cadastrado"


@pytest.mark.parametrize("campo, valor", [("email", "nao-e-email"), ("senha", None), ("nome", None)])
def test_cadastro_invalido_da_422(client, campo, valor):
    dados = {**CONTA, campo: valor}
    if valor is None:
        del dados[campo]

    assert client.post("/api/auth/cadastro", json=dados).status_code == 422


# ---------- login ----------


def test_login_grava_o_token_em_cookie_httponly(client):
    cadastrar(client)

    resposta = logar(client)

    assert resposta.status_code == 200
    # o token não vem no corpo: só no cookie, que o JavaScript não consegue ler
    assert "access_token" not in resposta.json()
    cookie = resposta.headers["set-cookie"]
    assert cookie.startswith("access_token=")
    assert "HttpOnly" in cookie
    assert "samesite=lax" in cookie.lower()


@pytest.mark.parametrize("email, senha", [(CONTA["email"], "errada"), ("ninguem@teste.com", CONTA["senha"])])
def test_login_com_credenciais_erradas_da_401(client, email, senha):
    cadastrar(client)

    resposta = logar(client, email, senha)

    assert resposta.status_code == 401
    # mesma mensagem nos dois casos: não revela se o email existe
    assert resposta.json()["detail"] == "Email ou senha incorretos"
    assert "set-cookie" not in resposta.headers


# ---------- sessão (/me e logout) ----------


def test_me_sem_login_da_401(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_depois_do_login_devolve_o_usuario(client):
    cadastrar(client)
    logar(client)  # o TestClient guarda o cookie, como o navegador

    resposta = client.get("/api/auth/me")

    assert resposta.status_code == 200
    assert resposta.json()["email"] == CONTA["email"]


def test_logout_apaga_o_cookie_e_encerra_a_sessao(client):
    cadastrar(client)
    logar(client)

    resposta = client.post("/api/auth/logout")

    assert resposta.status_code == 204
    assert client.get("/api/auth/me").status_code == 401


@pytest.mark.parametrize(
    "token",
    [
        "isso-nao-e-um-jwt",
        criar_token({"sub": "999"}),  # usuário que não existe
        criar_token({"outro": "campo"}),  # sem o "sub"
    ],
)
def test_cookie_com_token_invalido_da_401(client, token):
    client.cookies.set("access_token", token)

    assert client.get("/api/auth/me").status_code == 401


def test_header_authorization_nao_autentica(client):
    # a API só aceita o cookie; o Bearer antigo não pode mais funcionar
    cadastrar(client)
    token = criar_token({"sub": "1"})

    resposta = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert resposta.status_code == 401


# ---------- rotas protegidas e isolamento ----------


@pytest.mark.parametrize(
    "metodo, rota",
    [
        ("get", "/api/campeonatos/"),
        ("post", "/api/campeonatos/"),
        ("get", "/api/campeonatos/1/times"),
        ("get", "/api/campeonatos/1/partidas"),
        ("get", "/api/campeonatos/1/classificacao"),
        ("post", "/api/campeonatos/1/calendario"),
        ("get", "/api/partidas/1/eventos"),
        ("delete", "/api/eventos/1"),
    ],
)
def test_rotas_protegidas_exigem_login(client, metodo, rota):
    assert getattr(client, metodo)(rota).status_code == 401


def test_organizador_nao_ve_nem_altera_campeonato_de_outro(client):
    cadastrar(client)
    logar(client)
    campeonato = client.post(
        "/api/campeonatos/", json={"nome": "Copa do A", "data_inicio": "2026-03-01"}
    ).json()
    client.post("/api/auth/logout")

    cadastrar(client, email="outro@teste.com")
    logar(client, email="outro@teste.com")

    assert client.get("/api/campeonatos/").json() == []
    cid = campeonato["id"]
    assert client.get(f"/api/campeonatos/{cid}").status_code == 404
    assert client.put(f"/api/campeonatos/{cid}", json={"nome": "Roubado"}).status_code == 404
    assert client.delete(f"/api/campeonatos/{cid}").status_code == 404
    assert client.post(f"/api/campeonatos/{cid}/times", json={"nome": "Intruso"}).status_code == 404
