from sqlalchemy import func
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


def _verificar_nao_encerrado(campeonato: Campeonato):
    """Campeonato encerrado não aceita mais mudanças nos times."""
    if campeonato.encerrado:
        raise HTTPException(status_code=400, detail="O campeonato está encerrado")


def _verificar_nome_unico(db: Session, campeonato_id: int, nome: str, ignorar_id: int | None = None):
    """Dois times do mesmo campeonato não podem ter o mesmo nome (sem diferenciar maiúsculas)."""
    consulta = db.query(Time).filter(
        Time.campeonato_id == campeonato_id,
        func.lower(Time.nome) == nome.lower(),
    )
    if ignorar_id is not None:
        consulta = consulta.filter(Time.id != ignorar_id)
    if consulta.first():
        raise HTTPException(status_code=400, detail="Já existe um time com esse nome neste campeonato")


def criar(db: Session, campeonato_id: int, dados: TimeCreate, user_id: int) -> Time:
    """Cadastra um time no campeonato."""
    campeonato = _verificar_campeonato(db, campeonato_id, user_id)
    _verificar_nao_encerrado(campeonato)
    _verificar_nome_unico(db, campeonato_id, dados.nome)
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
    _verificar_nao_encerrado(time.campeonato)
    if dados.nome is not None:
        _verificar_nome_unico(db, time.campeonato_id, dados.nome, ignorar_id=time.id)
        time.nome = dados.nome
    salvar(db)
    db.refresh(time)
    return time


def excluir(db: Session, time_id: int, user_id: int):
    """Remove o time (cascade em jogadores)."""
    time = obter(db, time_id, user_id)
    _verificar_nao_encerrado(time.campeonato)
    # as partidas apontam pro time; sem essa checagem o banco barra com um erro genérico
    if time.partidas_mandante or time.partidas_visitante:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir um time que já tem partidas. Exclua as partidas dele antes.",
        )
    db.delete(time)
    salvar(db)
