from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Partida(Base):
    __tablename__ = "partidas"
    __table_args__ = (
        # US 17: duas partidas não podem ocorrer no mesmo horário e local
        UniqueConstraint("data_hora", "local", name="uq_partidas_data_hora_local"),
        # Uma partida deve ser entre dois times distintos
        CheckConstraint("time_mandante_id <> time_visitante_id", name="ck_partidas_times_diferentes"),
    )

    id = Column(Integer, primary_key=True, index=True)
    data_hora = Column(DateTime, nullable=False)
    local = Column(String(200), nullable=False)
    campeonato_id = Column(Integer, ForeignKey("campeonatos.id"), nullable=False)
    time_mandante_id = Column(Integer, ForeignKey("times.id"), nullable=False)
    time_visitante_id = Column(Integer, ForeignKey("times.id"), nullable=False)

    campeonato = relationship("Campeonato", back_populates="partidas")
    time_mandante = relationship("Time", foreign_keys=[time_mandante_id], back_populates="partidas_mandante")
    time_visitante = relationship("Time", foreign_keys=[time_visitante_id], back_populates="partidas_visitante")
    eventos = relationship("EventoPartida", back_populates="partida", cascade="all, delete-orphan")