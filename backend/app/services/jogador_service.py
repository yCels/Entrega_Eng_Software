from sqlalchemy.orm import Session
from app.core.transacao import salvar
from fastapi import HTTPException

from app.models.jogador import Jogador
from app.models.time import Time
from app.models.campeonato import Campeonato
from app.schemas.jogador import JogadorCreate, JogadorUpdate


def _verificar_time(db: Session, time_id: int, user_id: int) -> Time:
    """Busca time verificando que o campeonato pertence ao organizador."""
    time = db.query(Time).filter(Time.id == time_id).first()
    if not time:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    campeonato = db.query(Campeonato).filter(
        Campeonato.id == time.campeonato_id,
        Campeonato.organizador_id == user_id,
    ).first()
    if not campeonato:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    return time


def criar(db: Session, time_id: int, dados: JogadorCreate, user_id: int) -> Jogador:
    """Cadastra jogador no time."""
    _verificar_time(db, time_id, user_id)
    novo_jogador = Jogador(
        nome=dados.nome,
        numero_camisa=dados.numero_camisa,
        posicao=dados.posicao,
        time_id=time_id,
    )
    db.add(novo_jogador)
    salvar(db)
    db.refresh(novo_jogador)
    return novo_jogador


def listar(db: Session, time_id: int, user_id: int) -> list[Jogador]:
    """Lista jogadores do time."""
    _verificar_time(db, time_id, user_id)
    return db.query(Jogador).filter(Jogador.time_id == time_id).all()


def obter(db: Session, jogador_id: int, user_id: int) -> Jogador:
    """Busca jogador pelo ID, verificando posse."""
    jogador = db.query(Jogador).filter(Jogador.id == jogador_id).first()
    if not jogador:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")
    _verificar_time(db, jogador.time_id, user_id)
    return jogador


def editar(db: Session, jogador_id: int, dados: JogadorUpdate, user_id: int) -> Jogador:
    """Atualiza dados do jogador."""
    jogador = obter(db, jogador_id, user_id)
    if dados.nome is not None:
        jogador.nome = dados.nome
    if dados.numero_camisa is not None:
        jogador.numero_camisa = dados.numero_camisa
    if dados.posicao is not None:
        jogador.posicao = dados.posicao
    salvar(db)
    db.refresh(jogador)
    return jogador


def excluir(db: Session, jogador_id: int, user_id: int):
    """Remove o jogador."""
    jogador = obter(db, jogador_id, user_id)
    db.delete(jogador)
    salvar(db)
