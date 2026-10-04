from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate
from app.core.security import hash_senha, verificar_senha, criar_token
from app.core.transacao import salvar


def cadastrar(db: Session, dados: UsuarioCreate) -> Usuario:
    """Cadastra novo organizador. Erro 400 se email já existe."""
    existente = db.query(Usuario).filter(Usuario.email == dados.email).first()
    if existente:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    novo_usuario = Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=hash_senha(dados.senha),
    )
    db.add(novo_usuario)
    # Se outra requisição cadastrou o mesmo email ao mesmo tempo,
    # a UNIQUE de usuarios.email dispara e é feito ROLLBACK.
    salvar(db, "Email já cadastrado")
    db.refresh(novo_usuario)
    return novo_usuario


def login(db: Session, email: str, senha: str) -> dict:
    """Valida credenciais e retorna token JWT. Erro 401 se inválido."""
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario or not verificar_senha(senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    token = criar_token(data={"sub": str(usuario.id)})
    return {"access_token": token, "token_type": "bearer"}
