from sqlalchemy.orm import Session
from app.core.transacao import salvar
from fastapi import HTTPException

from app.models.evento_partida import EventoPartida, TipoEvento
from app.models.partida import Partida
from app.models.campeonato import Campeonato
from app.schemas.evento_partida import EventoPartidaCreate


def _verificar_partida(db: Session, partida_id: int, user_id: int) -> Partida:
    """Busca partida verificando posse do campeonato."""
    partida = db.query(Partida).filter(Partida.id == partida_id).first()
    if not partida:
        raise HTTPException(status_code=404, detail="Partida não encontrada")
    campeonato = db.query(Campeonato).filter(
        Campeonato.id == partida.campeonato_id,
        Campeonato.organizador_id == user_id,
    ).first()
    if not campeonato:
        raise HTTPException(status_code=404, detail="Partida não encontrada")
    return partida


def registrar(db: Session, partida_id: int, dados: EventoPartidaCreate, user_id: int) -> EventoPartida:
    """Registra evento (gol/cartão) vinculado a jogador e time."""
    partida = _verificar_partida(db, partida_id, user_id)

    # valida que o time participa desta partida
    if dados.time_id not in (partida.time_mandante_id, partida.time_visitante_id):
        raise HTTPException(status_code=400, detail="Este time não participa desta partida")

    # valida o tipo de evento
    try:
        TipoEvento(dados.tipo)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo inválido. Use: {', '.join(e.value for e in TipoEvento)}",
        )

    novo_evento = EventoPartida(
        tipo=dados.tipo,
        minuto=dados.minuto,
        partida_id=partida_id,
        jogador_id=dados.jogador_id,
        time_id=dados.time_id,
    )
    db.add(novo_evento)
    salvar(db)
    db.refresh(novo_evento)
    return novo_evento


def listar(db: Session, partida_id: int, user_id: int) -> list[EventoPartida]:
    """Lista eventos da partida ordenados por minuto."""
    _verificar_partida(db, partida_id, user_id)
    return (
        db.query(EventoPartida)
        .filter(EventoPartida.partida_id == partida_id)
        .order_by(EventoPartida.minuto)
        .all()
    )


def calcular_placar(db: Session, partida_id: int, user_id: int) -> dict:
    """Conta gols por time — placar automático (US 20)."""
    partida = _verificar_partida(db, partida_id, user_id)

    gols_mandante = db.query(EventoPartida).filter(
        EventoPartida.partida_id == partida_id,
        EventoPartida.tipo == TipoEvento.GOL,
        EventoPartida.time_id == partida.time_mandante_id,
    ).count()

    gols_visitante = db.query(EventoPartida).filter(
        EventoPartida.partida_id == partida_id,
        EventoPartida.tipo == TipoEvento.GOL,
        EventoPartida.time_id == partida.time_visitante_id,
    ).count()

    return {
        "partida_id": partida_id,
        "time_mandante_id": partida.time_mandante_id,
        "gols_mandante": gols_mandante,
        "time_visitante_id": partida.time_visitante_id,
        "gols_visitante": gols_visitante,
    }
