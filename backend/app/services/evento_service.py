from sqlalchemy.orm import Session
from app.core.transacao import salvar
from fastapi import HTTPException

from app.models.evento_partida import EventoPartida, TipoEvento
from app.models.jogador import Jogador
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


def _verificar_partida_aberta(partida: Partida):
    """Eventos só mudam com o campeonato em andamento e a partida não finalizada."""
    if partida.campeonato.encerrado:
        raise HTTPException(status_code=400, detail="O campeonato está encerrado")
    # o placar de uma partida finalizada já conta na classificação
    if partida.finalizada:
        raise HTTPException(
            status_code=400,
            detail="A partida está finalizada. Reabra a partida para alterar os eventos.",
        )


def registrar(db: Session, partida_id: int, dados: EventoPartidaCreate, user_id: int) -> EventoPartida:
    """Registra evento (gol/cartão) vinculado a jogador e time.

    O tipo já chega validado pelo schema (enum TipoEvento).
    """
    partida = _verificar_partida(db, partida_id, user_id)
    _verificar_partida_aberta(partida)

    # valida que o time participa desta partida
    if dados.time_id not in (partida.time_mandante_id, partida.time_visitante_id):
        raise HTTPException(status_code=400, detail="Este time não participa desta partida")

    # valida que o jogador existe e é do time informado
    # (senão um gol do time A poderia ser lançado com um jogador do time B)
    jogador = db.query(Jogador).filter(Jogador.id == dados.jogador_id).first()
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")
    if jogador.time_id != dados.time_id:
        raise HTTPException(status_code=400, detail="Este jogador não pertence ao time informado")

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
    """Lista eventos da partida ordenados por minuto (sem minuto vão para o fim)."""
    _verificar_partida(db, partida_id, user_id)
    return (
        db.query(EventoPartida)
        .filter(EventoPartida.partida_id == partida_id)
        .order_by(EventoPartida.minuto.is_(None), EventoPartida.minuto, EventoPartida.id)
        .all()
    )


def excluir(db: Session, evento_id: int, user_id: int):
    """Remove um evento lançado errado; o placar e a classificação se ajustam sozinhos."""
    evento = db.query(EventoPartida).filter(EventoPartida.id == evento_id).first()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    partida = _verificar_partida(db, evento.partida_id, user_id)
    _verificar_partida_aberta(partida)
    db.delete(evento)
    salvar(db)


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
