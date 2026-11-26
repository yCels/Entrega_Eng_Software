from datetime import date, time
from typing import Optional

from pydantic import BaseModel, Field


class CalendarioCreate(BaseModel):
    local: str = Field(min_length=1, max_length=200)
    # se não vier, usa a data de início do campeonato
    data_inicio: Optional[date] = None
    horario: time = time(15, 0)
    intervalo_dias: int = Field(default=7, ge=1)
    duracao_jogo_minutos: int = Field(default=120, ge=1)
    ida_e_volta: bool = False
