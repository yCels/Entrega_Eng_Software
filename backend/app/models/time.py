class Time(Base):
    __tablename__="times"
    id=Column(Integer, primary_key=True)
    nome=Column(String)
    campeonato_id=Column(Integer, ForeignKey("campeonatos.id"))
    