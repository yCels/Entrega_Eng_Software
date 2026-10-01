from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.time import TimeCreate, TimeUpdate, TimeResponse
from app.services import time_service
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter()


@router.post(
    "/campeonatos/{campeonato_id}/times",
    response_model=TimeResponse,
    status_code=201,
    tags=["Times"],
)
def criar_time(
    campeonato_id: int,
    dados: TimeCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return time_service.criar(db, campeonato_id, dados, current_user.id)


@router.get(
    "/campeonatos/{campeonato_id}/times",
    response_model=list[TimeResponse],
    tags=["Times"],
)
def listar_times(
    campeonato_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return time_service.listar(db, campeonato_id, current_user.id)


@router.put("/times/{time_id}", response_model=TimeResponse, tags=["Times"])
def editar_time(
    time_id: int,
    dados: TimeUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return time_service.editar(db, time_id, dados, current_user.id)


@router.delete("/times/{time_id}", status_code=204, tags=["Times"])
def excluir_time(
    time_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    time_service.excluir(db, time_id, current_user.id)
