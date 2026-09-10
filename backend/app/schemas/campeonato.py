from pydantic import BaseModel
from datetime import date
from typing import Optional

class CampeonatoCreate(BaseModel):
    nome : str
    data_inicio : date
    
class CampeonatoUpdate(BaseModel):
    nome: Optional[str] = None
    data_inicio: Optional[date] = None
    encerrado: Optional[bool] = None


class CampeonatoResponse(BaseModel):
    id:int
    nome: str
    data_inicio : date
    encerrado : bool
    organizador_id : int

    class Config:
        from_attributes = True