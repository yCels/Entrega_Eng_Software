from pydantic import BaseModel
from typing import Optional

class JogadorCreate(BaseModel):
    nome:str
    numero_camisa:Optional[int]=None
    posicao:Optional[str]=None
   
    
class JogadorUpdate(BaseModel):
    nome:Optional[str] = None
    numero_camisa:Optional[int] = None
    posicao:Optional[str] = None
    
    
class JogadorResponse(BaseModel):
    id:int
    nome: str 
    numero_camisa:Optional[int]
    posicao:Optional[str]
    time_id:int
    
    class Config:
        from_attributes = True
