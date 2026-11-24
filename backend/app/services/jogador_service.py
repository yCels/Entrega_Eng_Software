from sqlalchemy.orm import Session
from app.core.transacao import salvar
from fastapi import HTTPException

from app.models.evento_partida import EventoPartida
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


def _verificar_nao_encerrado(time: Time):
    """Campeonato encerrado não aceita mais mudanças no elenco."""
    if time.campeonato.encerrado:
        raise HTTPException(status_code=400, detail="O campeonato está encerrado")


def criar(db: Session, time_id: int, dados: JogadorCreate, user_id: int) -> Jogador:
    """Cadastra jogador no time."""
    time = _verificar_time(db, time_id, user_id)
    _verificar_nao_encerrado(time)
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
    """Lista jogadores do time pelo número da camisa (sem número no fim) e nome."""
    _verificar_time(db, time_id, user_id)
    return (
        db.query(Jogador)
        .filter(Jogador.time_id == time_id)
        .order_by(Jogador.numero_camisa.is_(None), Jogador.numero_camisa, Jogador.nome)
        .all()
    )


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
    _verificar_nao_encerrado(jogador.time)
    # exclude_unset: só mexe no que foi enviado. Assim mandar
    # "numero_camisa": null apaga o número, e não mandar o campo mantém.
    alteracoes = dados.model_dump(exclude_unset=True)
    if "nome" in alteracoes and alteracoes["nome"] is None:
        raise HTTPException(status_code=400, detail="O nome do jogador não pode ficar vazio")
    for campo, valor in alteracoes.items():
        setattr(jogador, campo, valor)
    salvar(db)
    db.refresh(jogador)
    return jogador


def excluir(db: Session, jogador_id: int, user_id: int):
    """Remove o jogador. Quem já tem gol ou cartão registrado não pode sair do histórico."""
    jogador = obter(db, jogador_id, user_id)
    _verificar_nao_encerrado(jogador.time)
    tem_eventos = db.query(EventoPartida).filter(EventoPartida.jogador_id == jogador.id).first()
    if tem_eventos:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir um jogador que tem gols ou cartões registrados",
        )
    db.delete(jogador)
    salvar(db)
