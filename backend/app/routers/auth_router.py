from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, LoginRequest, Token
from app.services import auth_service
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter()


@router.post("/cadastro", response_model=UsuarioResponse, status_code=201)
def cadastrar(dados: UsuarioCreate, db: Session = Depends(get_db)):
    """Cadastra um novo organizador."""
    return auth_service.cadastrar(db, dados)


@router.post("/login", response_model=Token)
def login(dados: LoginRequest, db: Session = Depends(get_db)):
    """Faz login e retorna o token JWT."""
    return auth_service.login(db, dados.email, dados.senha)


@router.get("/me", response_model=UsuarioResponse)
def me(current_user: Usuario = Depends(get_current_user)):
    """Retorna os dados do usuário autenticado."""
    return current_user
