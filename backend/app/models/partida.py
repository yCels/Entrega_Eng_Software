class Partida(Base):
    __tablename__="partidas"
    id=Column(Integer, primary_key=True)
    data_hora=Column(DateTime)
    local=Column(String)
    campeonato_id=Column(Integer,ForeignKey("campeonatos.id"))
    time_mandante_id = Column(Integer,ForeignKey("times.id"))
    time_visitante_id = Column(Integer,ForeignKey("times.id"))
    