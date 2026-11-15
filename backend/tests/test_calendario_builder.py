from collections import Counter, defaultdict
from datetime import date, datetime, time
from itertools import combinations

import pytest

from app.services.calendario_builder import CalendarioBuilder

INICIO = date(2026, 3, 1)


def builder(times):
    return (
        CalendarioBuilder()
        .set_times(times)
        .set_local("Quadra Central")
        .set_data_inicio(INICIO)
    )


def jogos_por_dia(partidas):
    dias = defaultdict(list)
    for p in partidas:
        dias[p.data_hora.date()].append(p)
    return dias


def confrontos(partidas):
    return Counter(frozenset((p.time_mandante_id, p.time_visitante_id)) for p in partidas)


@pytest.mark.parametrize("quantidade", [2, 3, 4, 5, 6, 7, 8])
def test_todos_jogam_contra_todos_uma_vez(quantidade):
    times = list(range(1, quantidade + 1))
    partidas = builder(times).build()

    assert len(partidas) == quantidade * (quantidade - 1) // 2
    esperado = {frozenset(par) for par in combinations(times, 2)}
    assert set(confrontos(partidas)) == esperado
    assert all(vezes == 1 for vezes in confrontos(partidas).values())


@pytest.mark.parametrize("quantidade", [4, 5, 6, 7])
def test_ninguem_joga_duas_vezes_na_mesma_rodada(quantidade):
    partidas = builder(list(range(1, quantidade + 1))).build()

    for jogos in jogos_por_dia(partidas).values():
        times_do_dia = [t for p in jogos for t in (p.time_mandante_id, p.time_visitante_id)]
        assert len(times_do_dia) == len(set(times_do_dia))


def test_numero_de_rodadas_par_e_impar():
    # par: n-1 rodadas com n/2 jogos; ímpar: n rodadas, cada time folga uma vez
    assert len(jogos_por_dia(builder([1, 2, 3, 4]).build())) == 3
    rodadas_5 = jogos_por_dia(builder([1, 2, 3, 4, 5]).build())
    assert len(rodadas_5) == 5
    assert all(len(jogos) == 2 for jogos in rodadas_5.values())


def test_datas_seguem_o_intervalo_e_jogos_da_rodada_sao_escalonados():
    partidas = (
        builder([1, 2, 3, 4])
        .set_horario(time(10, 0))
        .set_intervalo_dias(3)
        .set_duracao_jogo(90)
        .build()
    )

    assert [p.data_hora for p in partidas] == [
        datetime(2026, 3, 1, 10, 0), datetime(2026, 3, 1, 11, 30),
        datetime(2026, 3, 4, 10, 0), datetime(2026, 3, 4, 11, 30),
        datetime(2026, 3, 7, 10, 0), datetime(2026, 3, 7, 11, 30),
    ]
    assert all(p.local == "Quadra Central" for p in partidas)


def test_nao_gera_duas_partidas_no_mesmo_horario_e_local():
    # mesma regra da UNIQUE (data_hora, local) do banco
    partidas = builder(list(range(1, 9))).set_ida_e_volta(True).build()
    chaves = [(p.data_hora, p.local) for p in partidas]
    assert len(chaves) == len(set(chaves))


def test_ida_e_volta_inverte_os_mandos():
    partidas = builder([1, 2, 3, 4]).set_ida_e_volta(True).build()

    assert len(partidas) == 12
    assert len(jogos_por_dia(partidas)) == 6
    mandos = Counter((p.time_mandante_id, p.time_visitante_id) for p in partidas)
    # cada par se enfrenta uma vez em cada mando
    assert all(vezes == 1 for vezes in mandos.values())
    assert len(mandos) == 12


def test_mando_de_campo_equilibrado():
    partidas = builder([1, 2, 3, 4, 5, 6]).build()
    em_casa = Counter(p.time_mandante_id for p in partidas)
    # 5 jogos por time: ninguém fica com todos em casa ou todos fora
    assert all(1 <= em_casa[t] <= 4 for t in range(1, 7))


@pytest.mark.parametrize(
    "montar, mensagem",
    [
        (lambda: builder([1]), "pelo menos 2 times"),
        (lambda: builder([1, 1, 2]), "repetidos"),
        (lambda: builder([1, 2]).set_local("  "), "local"),
        (lambda: CalendarioBuilder().set_times([1, 2]).set_local("X"), "data de início"),
        (lambda: builder([1, 2]).set_intervalo_dias(0), "intervalo"),
    ],
)
def test_configuracao_invalida(montar, mensagem):
    with pytest.raises(ValueError, match=mensagem):
        montar().build()
