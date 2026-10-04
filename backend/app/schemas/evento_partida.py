from pydantic import BaseModel
from typing import Optional

class EventoPartidaCreate(BaseModel):
    jogador_id: int
    time_id: int
    tipo: str
    minuto: Optional[int] = None

class EventoPartidaResponse(BaseModel):
    id: int
    partida_id: int
    jogador_id: int
    time_id: int
    tipo: str
    minuto: Optional[int] = None

    class Config:
        from_attributes = True