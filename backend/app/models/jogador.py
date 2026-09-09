

class Jogador(Base):
    __tablename__="jogadores"
    id=Column(Integer, primary_key=True)
    nome=Column(String)
    numero_camisa=Column(Integer)
    posicao=Column(String)
    time_id=Column(Integer,ForeignKey("times.id"))
    


    