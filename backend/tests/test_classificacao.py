from datetime import date, datetime, timedelta

import pytest
from fastapi import HTTPException

from app.models.usuario import Usuario
from app.models.campeonato import Campeonato
from app.models.time import Time
from app.models.jogador import Jogador
from app.models.partida import Partida
from app.models.evento_partida import EventoPartida, TipoEvento
from app.services import classificacao_service

ONTEM = datetime.now() - timedelta(days=1)
AMANHA = datetime.now() + timedelta(days=1)


# ---------- funções de apoio pra montar os dados ----------


def criar_campeonato(db, nomes_times):
    usuario = Usuario(nome="Teste", email="teste@teste.com", senha_hash="x")
    db.add(usuario)
    db.commit()

    campeonato = Campeonato(
        nome="Copa Teste", data_inicio=date.today(), organizador_id=usuario.id
    )
    db.add(campeonato)
    db.commit()

    times = {}
    for nome in nomes_times:
        time = Time(nome=nome, campeonato_id=campeonato.id)
        db.add(time)
        db.commit()
        jogador = Jogador(nome="Jogador " + nome, time_id=time.id)
        db.add(jogador)
        db.commit()
        times[nome] = (time, jogador)

    return usuario, campeonato, times


def criar_partida(db, campeonato, mandante, visitante, data_hora=ONTEM, local="Quadra"):
    partida = Partida(
        data_hora=data_hora,
        local=local,
        campeonato_id=campeonato.id,
        time_mandante_id=mandante[0].id,
        time_visitante_id=visitante[0].id,
    )
    db.add(partida)
    db.commit()
    return partida


def lancar(db, partida, time_e_jogador, quantidade=1, tipo=TipoEvento.GOL):
    time, jogador = time_e_jogador
    for _ in range(quantidade):
        db.add(
            EventoPartida(
                tipo=tipo, partida_id=partida.id, jogador_id=jogador.id, time_id=time.id
            )
        )
    db.commit()


def linha_do(tabela, nome):
    return next(linha for linha in tabela if linha["time_nome"] == nome)


# ---------- testes ----------


def test_vitoria_da_3_pontos_e_derrota_0(db):
    usuario, campeonato, times = criar_campeonato(db, ["A", "B"])
    partida = criar_partida(db, campeonato, times["A"], times["B"])
    lancar(db, partida, times["A"], 2)
    lancar(db, partida, times["B"], 1)

    tabela = classificacao_service.gerar(db, campeonato.id, usuario.id)

    a = linha_do(tabela, "A")
    b = linha_do(tabela, "B")
    assert a["pontos"] == 3 and a["vitorias"] == 1 and a["saldo_gols"] == 1
    assert b["pontos"] == 0 and b["derrotas"] == 1 and b["saldo_gols"] == -1


def test_empate_da_1_ponto_pra_cada(db):
    usuario, campeonato, times = criar_campeonato(db, ["A", "B"])
    partida = criar_partida(db, campeonato, times["A"], times["B"])
    lancar(db, partida, times["A"], 1)
    lancar(db, partida, times["B"], 1)

    tabela = classificacao_service.gerar(db, campeonato.id, usuario.id)

    for linha in tabela:
        assert linha["pontos"] == 1
        assert linha["empates"] == 1


def test_cartao_nao_conta_como_gol(db):
    usuario, campeonato, times = criar_campeonato(db, ["A", "B"])
    partida = criar_partida(db, campeonato, times["A"], times["B"])
    lancar(db, partida, times["A"], 3, tipo=TipoEvento.CARTAO_AMARELO)
    lancar(db, partida, times["A"], 1, tipo=TipoEvento.CARTAO_VERMELHO)

    tabela = classificacao_service.gerar(db, campeonato.id, usuario.id)

    # sem gol nenhum, vira empate 0x0
    assert linha_do(tabela, "A")["gols_pro"] == 0
    assert linha_do(tabela, "A")["empates"] == 1


def test_partida_futura_nao_entra_na_tabela(db):
    usuario, campeonato, times = criar_campeonato(db, ["A", "B"])
    criar_partida(db, campeonato, times["A"], times["B"], data_hora=AMANHA)

    tabela = classificacao_service.gerar(db, campeonato.id, usuario.id)

    for linha in tabela:
        assert linha["jogos"] == 0
        assert linha["pontos"] == 0


def test_empate_em_pontos_desempata_pelo_saldo(db):
    usuario, campeonato, times = criar_campeonato(db, ["A", "B", "C", "D"])
    # A vence por 1x0 e C vence por 4x0: os dois com 3 pontos
    p1 = criar_partida(db, campeonato, times["A"], times["B"], local="Quadra 1")
    lancar(db, p1, times["A"], 1)
    p2 = criar_partida(db, campeonato, times["C"], times["D"], local="Quadra 2")
    lancar(db, p2, times["C"], 4)

    tabela = classificacao_service.gerar(db, campeonato.id, usuario.id)

    assert tabela[0]["time_nome"] == "C"
    assert tabela[1]["time_nome"] == "A"
    assert [linha["posicao"] for linha in tabela] == [1, 2, 3, 4]


def test_campeonato_de_outro_usuario_da_404(db):
    usuario, campeonato, times = criar_campeonato(db, ["A", "B"])

    with pytest.raises(HTTPException) as erro:
        classificacao_service.gerar(db, campeonato.id, usuario.id + 1)

    assert erro.value.status_code == 404
