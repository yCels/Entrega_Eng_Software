from io import StringIO
class Campeonato(Base):
    __tablename__="campeonatos"
    id=Column(Integer, primary_key=True)
    nome=Column(String)
    data_inicio=Column(Date)
    encerrado=Column(Boolean)
    organizador=Column(Integer , ForeignKey("usuarios.id"))
    time_mandante_id = Column(Integer,ForeignKey("times.id"))
    time_visitante_id = Column(Integer,ForeignKey("times.id"))
