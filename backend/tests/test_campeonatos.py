def logar(client):
    dados = {"nome": "Organizador", "email": "org@teste.com", "senha": "123456"}
    client.post("/api/auth/cadastro", json=dados)
    client.post("/api/auth/login", json={"email": dados["email"], "senha": dados["senha"]})


def criar_campeonato(client):
    resposta = client.post(
        "/api/campeonatos/", json={"nome": "Copa Teste", "data_inicio": "2026-11-01"}
    )
    return resposta.json()["id"]


def criar_time(client, campeonato_id, nome):
    resposta = client.post(f"/api/campeonatos/{campeonato_id}/times", json={"nome": nome})
    return resposta.json()["id"]


def test_campeonato_novo_comeca_com_totais_zerados(client):
    logar(client)
    criar_campeonato(client)

    campeonato = client.get("/api/campeonatos/").json()[0]

    assert campeonato["total_times"] == 0
    assert campeonato["total_partidas"] == 0


def test_totais_contam_os_times_e_partidas_do_campeonato(client):
    logar(client)
    campeonato_id = criar_campeonato(client)
    time_a = criar_time(client, campeonato_id, "Time A")
    time_b = criar_time(client, campeonato_id, "Time B")
    criar_time(client, campeonato_id, "Time C")
    client.post(
        f"/api/campeonatos/{campeonato_id}/partidas",
        json={
            "data_hora": "2026-11-10T15:00:00",
            "local": "Quadra",
            "time_mandante_id": time_a,
            "time_visitante_id": time_b,
        },
    )

    lista = client.get("/api/campeonatos/").json()[0]
    detalhe = client.get(f"/api/campeonatos/{campeonato_id}").json()

    for campeonato in (lista, detalhe):
        assert campeonato["total_times"] == 3
        assert campeonato["total_partidas"] == 1
