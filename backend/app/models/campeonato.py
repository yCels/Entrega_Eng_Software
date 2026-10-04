from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Campeonato(Base):
    __tablename__ = "campeonatos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    data_inicio = Column(Date, nullable=False)
    encerrado = Column(Boolean, default=False)
    organizador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    # Relacionamentos
    organizador = relationship("Usuario", back_populates="campeonatos")
    times = relationship("Time", back_populates="campeonato", cascade="all, delete-orphan")
    partidas = relationship("Partida", back_populates="campeonato", cascade="all, delete-orphan")