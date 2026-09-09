class Partida(Base):
    __talbename__="partidas"
    id=Column(Integer, primary_key=True)
    data_hora=Column(DateTime)
    local=Column(String)
    campeonato_id=Column(Integer, ForeignKey("campeonatos.id"))