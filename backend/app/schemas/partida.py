from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PartidaCreate(BaseModel):
    data_hora: datetime
    local: str = Field(min_length=1, max_length=200)
    time_mandante_id: int
    time_visitante_id: int

class PartidaUpdate(BaseModel):
    # só os campos enviados são alterados
    data_hora: Optional[datetime] = None
    local: Optional[str] = Field(default=None, min_length=1, max_length=200)
    time_mandante_id: Optional[int] = None
    time_visitante_id: Optional[int] = None

class PartidaResponse(BaseModel):
    id: int
    data_hora: datetime
    local: str
    campeonato_id: int
    time_mandante_id: int
    time_mandante_nome: str
    time_visitante_id: int
    time_visitante_nome: str
    finalizada: bool
    gols_mandante: int
    gols_visitante: int

    class Config:
        from_attributes = True
