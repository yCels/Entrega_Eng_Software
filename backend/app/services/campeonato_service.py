from datetime import date, datetime, time

from sqlalchemy.orm import Session
from app.core.transacao import salvar
from app.schemas.campeonato import CampeonatoCreate, CampeonatoUpdate
from app.models.campeonato import Campeonato
from app.models.partida import Partida
from fastapi import HTTPException

def criar(db: Session,dados: CampeonatoCreate,user_id: int ):
    novo_campeonato=Campeonato(
        nome=dados.nome, 
        data_inicio=dados.data_inicio, 
        organizador_id=user_id
    )
    db.add(novo_campeonato)
    salvar(db)
    db.refresh(novo_campeonato)
    return novo_campeonato


def listar(db: Session, user_id : int):
    lista = db.query(Campeonato).filter(Campeonato.organizador_id == user_id).all()
    return lista
    
def obter(db: Session, id: int , user_id: int):
    campeonato = db.query(Campeonato).filter(Campeonato.id == id  , Campeonato.organizador_id == user_id).first()
    return campeonato


def _verificar_partidas_antes(db: Session, campeonato: Campeonato, nova_data: date):
    """Mudar o início não pode deixar partidas antes da data nova."""
    antes = db.query(Partida).filter(
        Partida.campeonato_id == campeonato.id,
        Partida.data_hora < datetime.combine(nova_data, time.min),
    ).first()
    if antes:
        raise HTTPException(
            status_code=400,
            detail="Já existem partidas antes dessa data. Remarque ou exclua essas partidas antes de mudar o início.",
        )


def _verificar_sem_pendentes(db: Session, campeonato: Campeonato):
    """Só encerra quando todas as partidas estiverem finalizadas."""
    pendente = db.query(Partida).filter(
        Partida.campeonato_id == campeonato.id,
        Partida.finalizada.is_(False),
    ).first()
    if pendente:
        raise HTTPException(
            status_code=400,
            detail="Finalize ou exclua as partidas pendentes antes de encerrar o campeonato",
        )


def editar(db: Session, id: int, user_id: int, dados: CampeonatoUpdate):
    campeonato = obter(db, id, user_id)

    if not campeonato:
        raise HTTPException(
            status_code=404,
            detail="Campeonato não encontrado"
        )

    if dados.nome is not None:
        campeonato.nome = dados.nome

    if dados.data_inicio is not None:
        _verificar_partidas_antes(db, campeonato, dados.data_inicio)
        campeonato.data_inicio = dados.data_inicio

    if dados.encerrado is not None:
        if dados.encerrado and not campeonato.encerrado:
            _verificar_sem_pendentes(db, campeonato)
        campeonato.encerrado = dados.encerrado

    salvar(db)
    db.refresh(campeonato)

    return campeonato

def encerrar(db: Session, id: int, user_id: int):
    campeonato = obter(db, id, user_id)
    if not campeonato:
        raise HTTPException(
            status_code=404,
            detail="Campeonato não encontrado"
        )

    _verificar_sem_pendentes(db, campeonato)
    campeonato.encerrado = True
    salvar(db)
    db.refresh(campeonato)
    return campeonato

    


def excluir(db: Session, id: int, user_id: int):
    campeonato = obter(db, id, user_id)
    if not campeonato:
        raise HTTPException(
            status_code=404,
            detail="Campeonato não encontrado"
        )
    db.delete(campeonato)
    salvar(db)
    return {"mensagem": "Campeonato excluído com sucesso"}  
