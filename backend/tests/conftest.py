import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app as api  # "as api": o "import app.models" abaixo sobrescreveria o nome "app"
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


@pytest.fixture
def client():
    """Cliente HTTP da API inteira (rotas, cookie, validação) com banco em memória.

    O StaticPool mantém uma única conexão, senão cada requisição veria um
    banco SQLite em memória diferente. O TestClient não é usado com `with`,
    então o startup da API (que conecta no PostgreSQL) não roda.
    """
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)

    def get_db_de_teste():
        sessao = Session()
        try:
            yield sessao
        finally:
            sessao.close()

    api.dependency_overrides[get_db] = get_db_de_teste
    yield TestClient(api)
    api.dependency_overrides.clear()
