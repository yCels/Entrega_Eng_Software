class Usuario(Base):
    __tablename__="usuarios"
    id=Column(Integer, primary_key=True)
    nome=Column(String)
    email=Column(String, unique=True, index=True)
    senha_hash=Column(String)
   