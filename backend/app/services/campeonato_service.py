from sqlalchemy.orm import Session
from app.schemas.campeonato import CampeonatoCreate  
from app.models.campeonato import Campeonato  

def criar_campeonatos(db: Session,dados: CampeonatoCreate,user_id: int ):
    novo_campeonato=Campeonato(nome=dados.nome, data_inicio=dados.data_inicio, organizador_id=user_id)
    db.add(novo_campeonato)
    db.commit()
    db.refresh(novo_campeonato)
    return novo_campeonato


def listar_campeonatos(db: Session, user_id : int):
    
    