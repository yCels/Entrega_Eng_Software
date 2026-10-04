from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.campeonato import CampeonatoCreate, CampeonatoUpdate, CampeonatoResponse
from app.services import campeonato_service
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter()


@router.post("/", response_model=CampeonatoResponse, status_code=201)
def criar_campeonato(
    dados: CampeonatoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return campeonato_service.criar(db, dados, current_user.id)


@router.get("/", response_model=list[CampeonatoResponse])
def listar_campeonatos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return campeonato_service.listar(db, current_user.id)


@router.get("/{campeonato_id}", response_model=CampeonatoResponse)
def obter_campeonato(
    campeonato_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    campeonato = campeonato_service.obter(db, campeonato_id, current_user.id)
    if not campeonato:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Campeonato não encontrado")
    return campeonato


@router.put("/{campeonato_id}", response_model=CampeonatoResponse)
def editar_campeonato(
    campeonato_id: int,
    dados: CampeonatoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return campeonato_service.editar(db, campeonato_id, current_user.id, dados)


@router.delete("/{campeonato_id}", status_code=204)
def excluir_campeonato(
    campeonato_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    campeonato_service.excluir(db, campeonato_id, current_user.id)


@router.patch("/{campeonato_id}/encerrar", response_model=CampeonatoResponse)
def encerrar_campeonato(
    campeonato_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return campeonato_service.encerrar(db, campeonato_id, current_user.id)
