from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.calendario import CalendarioCreate
from app.schemas.partida import PartidaCreate, PartidaResponse
from app.services import calendario_service, partida_service
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter()


@router.post(
    "/campeonatos/{campeonato_id}/partidas",
    response_model=PartidaResponse,
    status_code=201,
    tags=["Partidas"],
)
def agendar_partida(
    campeonato_id: int,
    dados: PartidaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return partida_service.agendar(db, campeonato_id, dados, current_user.id)


@router.get(
    "/campeonatos/{campeonato_id}/partidas",
    response_model=list[PartidaResponse],
    tags=["Partidas"],
)
def listar_partidas(
    campeonato_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return partida_service.listar(db, campeonato_id, current_user.id)


@router.post(
    "/campeonatos/{campeonato_id}/calendario",
    response_model=list[PartidaResponse],
    status_code=201,
    tags=["Partidas"],
)
def gerar_calendario(
    campeonato_id: int,
    dados: CalendarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Gera todas as partidas do campeonato (todos contra todos) com o Builder Pattern."""
    return calendario_service.gerar(db, campeonato_id, dados, current_user.id)
