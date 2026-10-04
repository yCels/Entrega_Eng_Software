# Importa todos os models para que Base.metadata conheça todas as tabelas.
# Sem esses imports, o create_all() não cria as tabelas no banco.
from app.models.usuario import Usuario
from app.models.campeonato import Campeonato
from app.models.time import Time
from app.models.jogador import Jogador
from app.models.partida import Partida
from app.models.evento_partida import EventoPartida, TipoEvento
