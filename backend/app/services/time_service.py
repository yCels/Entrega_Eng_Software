from sqlalchemy.orm import Session
from app.core.transacao import salvar
from fastapi import HTTPException

from app.models.time import Time
from app.models.campeonato import Campeonato
from app.schemas.time import TimeCreate, TimeUpdate


def _verificar_campeonato(db: Session, campeonato_id: int, user_id: int) -> Campeonato:
    """Busca campeonato verificando que pertence ao organizador (isolamento)."""
    campeonato = db.query(Campeonato).filter(
        Campeonato.id == campeonato_id,
        Campeonato.organizador_id == user_id,
    ).first()
    if not campeonato:
        raise HTTPException(status_code=404, detail="Campeonato não encontrado")
    return campeonato


def criar(db: Session, campeonato_id: int, dados: TimeCreate, user_id: int) -> Time:
    """Cadastra um time no campeonato."""
    _verificar_campeonato(db, campeonato_id, user_id)
    novo_time = Time(nome=dados.nome, campeonato_id=campeonato_id)
    db.add(novo_time)
    salvar(db)
    db.refresh(novo_time)
    return novo_time


def listar(db: Session, campeonato_id: int, user_id: int) -> list[Time]:
    """Lista todos os times do campeonato."""
    _verificar_campeonato(db, campeonato_id, user_id)
    return db.query(Time).filter(Time.campeonato_id == campeonato_id).all()


def obter(db: Session, time_id: int, user_id: int) -> Time:
    """Busca um time pelo ID, verificando posse do campeonato."""
    time = db.query(Time).filter(Time.id == time_id).first()
    if not time:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    _verificar_campeonato(db, time.campeonato_id, user_id)
    return time


def editar(db: Session, time_id: int, dados: TimeUpdate, user_id: int) -> Time:
    """Atualiza o nome do time."""
    time = obter(db, time_id, user_id)
    if dados.nome is not None:
        time.nome = dados.nome
    salvar(db)
    db.refresh(time)
    return time


def excluir(db: Session, time_id: int, user_id: int):
    """Remove o time (cascade em jogadores)."""
    time = obter(db, time_id, user_id)
    db.delete(time)
    salvar(db)
