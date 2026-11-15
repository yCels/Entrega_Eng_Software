from datetime import datetime

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.campeonato import Campeonato
from app.models.time import Time
from app.models.partida import Partida
from app.models.evento_partida import EventoPartida, TipoEvento


def _contar_gols(db: Session, partida_id: int, time_id: int) -> int:
    # o placar não é digitado, é a contagem dos eventos de gol
    return (
        db.query(EventoPartida)
        .filter(
            EventoPartida.partida_id == partida_id,
            EventoPartida.time_id == time_id,
            EventoPartida.tipo == TipoEvento.GOL,
        )
        .count()
    )


def _somar_resultado(linha: dict, gols_feitos: int, gols_sofridos: int):
    # atualiza um time do ponto de vista dele: vitória 3, empate 1, derrota 0
    linha["jogos"] += 1
    linha["gols_pro"] += gols_feitos
    linha["gols_contra"] += gols_sofridos

    if gols_feitos > gols_sofridos:
        linha["vitorias"] += 1
        linha["pontos"] += 3
    elif gols_feitos == gols_sofridos:
        linha["empates"] += 1
        linha["pontos"] += 1
    else:
        linha["derrotas"] += 1


def gerar(db: Session, campeonato_id: int, user_id: int) -> list[dict]:
    campeonato = (
        db.query(Campeonato)
        .filter(
            Campeonato.id == campeonato_id,
            Campeonato.organizador_id == user_id,
        )
        .first()
    )
    if not campeonato:
        raise HTTPException(status_code=404, detail="Campeonato não encontrado")

    # começa todo time zerado
    tabela = {}
    times = db.query(Time).filter(Time.campeonato_id == campeonato_id).all()
    for time in times:
        tabela[time.id] = {
            "time_id": time.id,
            "time_nome": time.nome,
            "pontos": 0,
            "jogos": 0,
            "vitorias": 0,
            "empates": 0,
            "derrotas": 0,
            "gols_pro": 0,
            "gols_contra": 0,
            "saldo_gols": 0,
        }

    # por enquanto só conta partida que já passou do horário
    # TODO: trocar pelo campo finalizada quando entrar na Partida
    partidas = (
        db.query(Partida)
        .filter(
            Partida.campeonato_id == campeonato_id,
            Partida.data_hora <= datetime.now(),
        )
        .all()
    )

    for partida in partidas:
        mandante = tabela[partida.time_mandante_id]
        visitante = tabela[partida.time_visitante_id]

        gols_m = _contar_gols(db, partida.id, partida.time_mandante_id)
        gols_v = _contar_gols(db, partida.id, partida.time_visitante_id)

        _somar_resultado(mandante, gols_m, gols_v)
        _somar_resultado(visitante, gols_v, gols_m)

    for linha in tabela.values():
        linha["saldo_gols"] = linha["gols_pro"] - linha["gols_contra"]

    # ordena por pontos e desempata pelo saldo (maior primeiro)
    ordenada = sorted(
        tabela.values(),
        key=lambda l: (l["pontos"], l["saldo_gols"]),
        reverse=True,
    )

    for i, linha in enumerate(ordenada, start=1):
        linha["posicao"] = i

    return ordenada
