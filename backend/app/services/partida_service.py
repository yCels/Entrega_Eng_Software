from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from app.models.partida import Partida
from app.models.time import Time
from app.models.campeonato import Campeonato
from app.schemas.partida import PartidaCreate


def _verificar_campeonato(db: Session, campeonato_id: int, user_id: int) -> Campeonato:
    """Busca campeonato verificando posse do organizador."""
    campeonato = db.query(Campeonato).filter(
        Campeonato.id == campeonato_id,
        Campeonato.organizador_id == user_id,
    ).first()
    if not campeonato:
        raise HTTPException(status_code=404, detail="Campeonato não encontrado")
    return campeonato


def _validar_times(db: Session, campeonato_id: int, dados: PartidaCreate):
    """Valida que os dois times existem, pertencem ao campeonato e são diferentes."""
    if dados.time_mandante_id == dados.time_visitante_id:
        raise HTTPException(status_code=400, detail="Uma partida deve ser entre dois times diferentes")

    mandante = db.query(Time).filter(
        Time.id == dados.time_mandante_id,
        Time.campeonato_id == campeonato_id,
    ).first()
    if not mandante:
        raise HTTPException(status_code=404, detail="Time mandante não encontrado neste campeonato")

    visitante = db.query(Time).filter(
        Time.id == dados.time_visitante_id,
        Time.campeonato_id == campeonato_id,
    ).first()
    if not visitante:
        raise HTTPException(status_code=404, detail="Time visitante não encontrado neste campeonato")


def _validar_conflitos(db: Session, dados: PartidaCreate):
    """
    US 17: Impede duas partidas no mesmo horário e local.
    US 18: Impede um time de ter duas partidas no mesmo horário.
    """
    # Conflito de local + horário
    conflito_local = db.query(Partida).filter(
        Partida.data_hora == dados.data_hora,
        Partida.local == dados.local,
    ).first()
    if conflito_local:
        raise HTTPException(status_code=400, detail="Já existe uma partida neste horário e local")

    # Conflito de agenda do time
    conflito_time = db.query(Partida).filter(
        Partida.data_hora == dados.data_hora,
        or_(
            Partida.time_mandante_id.in_([dados.time_mandante_id, dados.time_visitante_id]),
            Partida.time_visitante_id.in_([dados.time_mandante_id, dados.time_visitante_id]),
        ),
    ).first()
    if conflito_time:
        raise HTTPException(status_code=400, detail="Um dos times já tem partida neste horário")


def agendar(db: Session, campeonato_id: int, dados: PartidaCreate, user_id: int) -> Partida:
    """Agenda uma partida com validação de conflitos."""
    _verificar_campeonato(db, campeonato_id, user_id)
    _validar_times(db, campeonato_id, dados)
    _validar_conflitos(db, dados)

    nova_partida = Partida(
        data_hora=dados.data_hora,
        local=dados.local,
        campeonato_id=campeonato_id,
        time_mandante_id=dados.time_mandante_id,
        time_visitante_id=dados.time_visitante_id,
    )
    db.add(nova_partida)
    db.commit()
    db.refresh(nova_partida)
    return nova_partida


def listar(db: Session, campeonato_id: int, user_id: int) -> list[Partida]:
    """Lista partidas do campeonato."""
    _verificar_campeonato(db, campeonato_id, user_id)
    return db.query(Partida).filter(Partida.campeonato_id == campeonato_id).all()


def obter(db: Session, partida_id: int, user_id: int) -> Partida:
    """Busca uma partida pelo ID, verificando posse."""
    partida = db.query(Partida).filter(Partida.id == partida_id).first()
    if not partida:
        raise HTTPException(status_code=404, detail="Partida não encontrada")
    _verificar_campeonato(db, partida.campeonato_id, user_id)
    return partida
