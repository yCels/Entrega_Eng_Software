from pydantic import BaseModel
from typing import Optional

class TimeCreate(BaseModel):
    nome : str

class TimeUpdate(BaseModel):
    nome: Optional[str] = None
    
class TimeResponse(BaseModel):
    id:int
    nome: str
    campeonato_id: int
    
    class Config:
        from_attributes = True##converto orm para o pydantic ler