from pydantic import BaseModel, Field
from typing import Optional

from app.models.evento_partida import TipoEvento


class EventoPartidaCreate(BaseModel):
    jogador_id: int
    time_id: int
    # o Pydantic recusa (422) qualquer valor fora do enum e o Swagger mostra as opções
    tipo: TipoEvento
    minuto: Optional[int] = Field(default=None, ge=0)


class EventoPartidaResponse(BaseModel):
    id: int
    partida_id: int
    jogador_id: int
    time_id: int
    tipo: TipoEvento
    minuto: Optional[int] = None

    class Config:
        from_attributes = True
