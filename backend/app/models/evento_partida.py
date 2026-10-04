import enum

from sqlalchemy import Column, Integer, ForeignKey, CheckConstraint, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base


class TipoEvento(str, enum.Enum):
    
    GOL = "gol"
    CARTAO_AMARELO = "cartao_amarelo"
    CARTAO_VERMELHO = "cartao_vermelho"


class EventoPartida(Base):
    __tablename__ = "eventos_partida"
    __table_args__ = (
        CheckConstraint("minuto IS NULL OR minuto >= 0", name="ck_eventos_minuto_positivo"),
    )

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(SAEnum(TipoEvento), nullable=False)
    minuto = Column(Integer, nullable=True)
    partida_id = Column(Integer, ForeignKey("partidas.id"), nullable=False)
    jogador_id = Column(Integer, ForeignKey("jogadores.id"), nullable=False)
    time_id = Column(Integer, ForeignKey("times.id"), nullable=False)

    
    partida = relationship("Partida", back_populates="eventos")
    jogador = relationship("Jogador", back_populates="eventos")
