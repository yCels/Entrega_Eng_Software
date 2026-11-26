from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UsuarioCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(min_length=1, max_length=100)
    email: EmailStr = Field(max_length=150)
    # mínimo igual ao do front; o bcrypt só considera os primeiros 72 bytes
    senha: str = Field(min_length=6, max_length=72)

class UsuarioResponse(BaseModel):
    id : int
    nome : str
    email : EmailStr

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str
