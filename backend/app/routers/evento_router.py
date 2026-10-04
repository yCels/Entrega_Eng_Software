from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.evento_partida import EventoPartidaCreate, EventoPartidaResponse
from app.services import evento_service
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter()


@router.post(
    "/partidas/{partida_id}/eventos",
    response_model=EventoPartidaResponse,
    status_code=201,
    tags=["Eventos"],
)
def registrar_evento(
    partida_id: int,
    dados: EventoPartidaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return evento_service.registrar(db, partida_id, dados, current_user.id)


@router.get(
    "/partidas/{partida_id}/eventos",
    response_model=list[EventoPartidaResponse],
    tags=["Eventos"],
)
def listar_eventos(
    partida_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return evento_service.listar(db, partida_id, current_user.id)


@router.get("/partidas/{partida_id}/placar", tags=["Eventos"])
def placar_automatico(
    partida_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return evento_service.calcular_placar(db, partida_id, current_user.id)
