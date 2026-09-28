from sqlalchemy.orm import Session
from app.schemas.campeonato import CampeonatoCreate, CampeonatoUpdate 
from app.models.campeonato import Campeonato  
from fastapi import HTTPException

def criar(db: Session,dados: CampeonatoCreate,user_id: int ):
    novo_campeonato=Campeonato(
        nome=dados.nome, 
        data_inicio=dados.data_inicio, 
        organizador_id=user_id
    )
    db.add(novo_campeonato)
    db.commit()
    db.refresh(novo_campeonato)
    return novo_campeonato


def listar(db: Session, user_id : int):
    lista = db.query(Campeonato).filter(Campeonato.organizador_id == user_id).all()
    return lista
    
def obter(db: Session, id: int , user_id: int):
    campeonato = db.query(Campeonato).filter(Campeonato.id == id  , Campeonato.organizador_id == user_id).first()
    return campeonato

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
        campeonato.data_inicio = dados.data_inicio

    if dados.encerrado is not None:
        campeonato.encerrado = dados.encerrado

    db.commit()
    db.refresh(campeonato)

    return campeonato

def encerrar(db: Session, id: int, user_id: int):
    campeonato = obter(db, id, user_id)
    if not campeonato:
        raise HTTPException(
            status_code=404,
            detail="Campeonato não encontrado"
        )
        
    campeonato.encerrado = True
    db.commit()
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
    db.commit()
    return {"mensagem": "Campeonato excluído com sucesso"}
    
    