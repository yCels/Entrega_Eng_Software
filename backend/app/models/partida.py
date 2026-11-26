from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, CheckConstraint, false
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.evento_partida import TipoEvento


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
    # só partida finalizada entra na classificação; depois de finalizada
    # não aceita mais eventos nem remarcação (até ser reaberta)
    finalizada = Column(Boolean, nullable=False, default=False, server_default=false())

    campeonato =relationship("Campeonato", back_populates="partidas")
    time_mandante = relationship("Time", foreign_keys=[time_mandante_id], back_populates="partidas_mandante")
    time_visitante = relationship("Time", foreign_keys=[time_visitante_id], back_populates="partidas_visitante")
    eventos = relationship("EventoPartida", back_populates="partida", cascade="all, delete-orphan")

    # usados pelo PartidaResponse: o front mostra os nomes sem cruzar ids
    @property
    def time_mandante_nome(self) -> str:
        return self.time_mandante.nome

    @property
    def time_visitante_nome(self) -> str:
        return self.time_visitante.nome

    # placar calculado pelos eventos de gol, pra lista de partidas não precisar de uma chamada por jogo
    @property
    def gols_mandante(self) -> int:
        return self._contar_gols(self.time_mandante_id)

    @property
    def gols_visitante(self) -> int:
        return self._contar_gols(self.time_visitante_id)

    def _contar_gols(self, time_id: int) -> int:
        return sum(1 for e in self.eventos if e.time_id == time_id and e.tipo == TipoEvento.GOL)
