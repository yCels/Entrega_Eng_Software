from typing import Optional


class Campeonato(Base):
    __tablename__="campeonatos"
    id= Column(Integer , primary_key=True)
    nome=Column(String)
    data_inicio=Column(Date)
    encerrado=Column(Boolean, default=False)
    organizador_id=Column(Integer , ForeignKey("usuarios.id"))
    