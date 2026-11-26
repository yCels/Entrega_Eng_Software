from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import Optional

class CampeonatoCreate(BaseModel):
    # tira os espaços das pontas antes de validar: "   " vira vazio e é recusado
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(min_length=1, max_length=200)
    data_inicio: date

class CampeonatoUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: Optional[str] = Field(default=None, min_length=1, max_length=200)
    data_inicio: Optional[date] = None
    encerrado: Optional[bool] = None


class CampeonatoResponse(BaseModel):
    id:int
    nome: str
    data_inicio : date
    encerrado : bool
    organizador_id : int
    total_times: int
    total_partidas: int

    class Config:
        from_attributes = True
