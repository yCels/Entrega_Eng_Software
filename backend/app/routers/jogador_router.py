from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.jogador import JogadorCreate, JogadorUpdate, JogadorResponse
from app.services import jogador_service
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter()


@router.post(
    "/times/{time_id}/jogadores",
    response_model=JogadorResponse,
    status_code=201,
    tags=["Jogadores"],
)
def criar_jogador(
    time_id: int,
    dados: JogadorCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return jogador_service.criar(db, time_id, dados, current_user.id)


@router.get(
    "/times/{time_id}/jogadores",
    response_model=list[JogadorResponse],
    tags=["Jogadores"],
)
def listar_jogadores(
    time_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return jogador_service.listar(db, time_id, current_user.id)


@router.put("/jogadores/{jogador_id}", response_model=JogadorResponse, tags=["Jogadores"])
def editar_jogador(
    jogador_id: int,
    dados: JogadorUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return jogador_service.editar(db, jogador_id, dados, current_user.id)


@router.delete("/jogadores/{jogador_id}", status_code=204, tags=["Jogadores"])
def excluir_jogador(
    jogador_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    jogador_service.excluir(db, jogador_id, current_user.id)
