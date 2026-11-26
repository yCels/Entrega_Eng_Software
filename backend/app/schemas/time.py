from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class TimeCreate(BaseModel):
    # tira os espaços das pontas antes de validar: "   " vira vazio e é recusado
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: str = Field(min_length=1, max_length=150)

class TimeUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nome: Optional[str] = Field(default=None, min_length=1, max_length=150)
    
class TimeResponse(BaseModel):
    id:int
    nome: str
    campeonato_id: int
    
    class Config:
        from_attributes = True##converto orm para o pydantic ler
