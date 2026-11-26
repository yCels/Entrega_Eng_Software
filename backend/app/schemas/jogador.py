from pydantic import BaseModel, Field
from typing import Optional

class JogadorCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=150)
    numero_camisa: Optional[int] = Field(default=None, ge=0, le=999)
    posicao: Optional[str] = Field(default=None, max_length=50)


class JogadorUpdate(BaseModel):
    # só os campos enviados mudam; numero_camisa/posicao com null são apagados
    nome: Optional[str] = Field(default=None, min_length=1, max_length=150)
    numero_camisa: Optional[int] = Field(default=None, ge=0, le=999)
    posicao: Optional[str] = Field(default=None, max_length=50)


class JogadorResponse(BaseModel):
    id:int
    nome: str
    numero_camisa:Optional[int]
    posicao:Optional[str]
    time_id:int

    class Config:
        from_attributes = True
