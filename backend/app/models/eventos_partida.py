class EventoPartida(Base):
    __tablename__="eventos_partida"
    id=Column(Integer, primary_key=True)
    tipo=Column(Enum("cartao_vermelho","cartao_amarelo","substituicao","gol"))
    minuto=Column(Integer)
    jogador_id=Column(Integer, ForeignKey("jogadores.id"))
    partida_id=Column(Integer , ForeignKey("partidas.id"))
    time_id=Column(Integer , ForeignKey("times.id"))