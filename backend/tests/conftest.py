import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
import app.models  # registra todas as tabelas no Base


@pytest.fixture
def db():
    # banco SQLite em memória: cada teste começa com um banco vazio
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    sessao = Session()
    yield sessao
    sessao.close()
