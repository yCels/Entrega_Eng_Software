from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Time(Base):
    __tablename__ = "times"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    campeonato_id = Column(Integer, ForeignKey("campeonatos.id"), nullable=False)

    
    campeonato = relationship("Campeonato", back_populates="times")
    jogadores = relationship("Jogador", back_populates="time", cascade="all, delete-orphan")
    partidas_mandante = relationship(
        "Partida", foreign_keys="Partida.time_mandante_id", back_populates="time_mandante"
    )
    partidas_visitante = relationship(
        "Partida", foreign_keys="Partida.time_visitante_id", back_populates="time_visitante"
    )