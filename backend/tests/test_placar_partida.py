def logar(client):
    dados = {"nome": "Organizador", "email": "org@teste.com", "senha": "123456"}
    client.post("/api/auth/cadastro", json=dados)
    client.post(
        "/api/auth/login", json={"email": dados["email"], "senha": dados["senha"]}
    )


def montar_partida(client):
    campeonato_id = client.post(
        "/api/campeonatos/", json={"nome": "Copa Teste", "data_inicio": "2026-11-01"}
    ).json()["id"]

    times = {}
    for nome in ("A", "B"):
        time_id = client.post(
            f"/api/campeonatos/{campeonato_id}/times", json={"nome": nome}
        ).json()["id"]
        jogador_id = client.post(
            f"/api/times/{time_id}/jogadores", json={"nome": f"Jogador {nome}"}
        ).json()["id"]
        times[nome] = (time_id, jogador_id)

    partida = client.post(
        f"/api/campeonatos/{campeonato_id}/partidas",
        json={
            "data_hora": "2026-11-10T15:00:00",
            "local": "Quadra",
            "time_mandante_id": times["A"][0],
            "time_visitante_id": times["B"][0],
        },
    ).json()
    return campeonato_id, partida, times


def lancar(client, partida_id, time, tipo="gol"):
    time_id, jogador_id = time
    client.post(
        f"/api/partidas/{partida_id}/eventos",
        json={"jogador_id": jogador_id, "time_id": time_id, "tipo": tipo},
    )


def test_partida_nova_comeca_com_placar_zerado(client):
    logar(client)
    _, partida, _ = montar_partida(client)

    assert partida["gols_mandante"] == 0
    assert partida["gols_visitante"] == 0


def test_placar_conta_so_os_gols_de_cada_time(client):
    logar(client)
    campeonato_id, partida, times = montar_partida(client)
    lancar(client, partida["id"], times["A"])
    lancar(client, partida["id"], times["A"])
    lancar(client, partida["id"], times["B"])
    lancar(client, partida["id"], times["B"], tipo="cartao_amarelo")

    detalhe = client.get(f"/api/partidas/{partida['id']}").json()
    lista = client.get(f"/api/campeonatos/{campeonato_id}/partidas").json()[0]

    for p in (detalhe, lista):
        assert p["gols_mandante"] == 2
        assert p["gols_visitante"] == 1
