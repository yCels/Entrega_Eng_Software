from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, LoginRequest
from app.services import auth_service
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario
from app.config import settings

router = APIRouter()


@router.post("/cadastro", response_model=UsuarioResponse, status_code=201)
def cadastrar(dados: UsuarioCreate, db: Session = Depends(get_db)):
    """Cadastra um novo organizador."""
    return auth_service.cadastrar(db, dados)


@router.post("/login")
def login(dados: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Faz login e guarda o token JWT num cookie HttpOnly."""
    resultado = auth_service.login(db, dados.email, dados.senha)
    # httponly: o JavaScript do front não consegue ler o cookie (protege contra XSS)
    # samesite: o navegador não manda o cookie em requisições vindas de outros sites
    response.set_cookie(
        key="access_token",
        value=resultado["access_token"],
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"mensagem": "Login realizado com sucesso"}


@router.post("/logout", status_code=204)
def logout(response: Response):
    """Apaga o cookie do token, encerrando a sessão."""
    response.delete_cookie(key="access_token")


@router.get("/me", response_model=UsuarioResponse)
def me(current_user: Usuario = Depends(get_current_user)):
    """Retorna os dados do usuário autenticado."""
    return current_user
