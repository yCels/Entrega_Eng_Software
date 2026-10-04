from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PartidaCreate(BaseModel):
    data_hora: datetime
    local: str
    time_mandante_id: int
    time_visitante_id: int

class PartidaResponse(BaseModel):
    id: int
    data_hora: datetime
    local: str
    campeonato_id: int
    time_mandante_id: int
    time_visitante_id: int

    class Config:
        from_attributes = True