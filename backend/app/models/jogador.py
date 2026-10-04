from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Jogador(Base):
    __tablename__ = "jogadores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    numero_camisa = Column(Integer, nullable=True)
    posicao = Column(String(50), nullable=True)
    time_id = Column(Integer, ForeignKey("times.id"), nullable=False)

    
    time = relationship("Time", back_populates="jogadores")
    eventos = relationship("EventoPartida", back_populates="jogador")