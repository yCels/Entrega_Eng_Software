from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency injection: fornece uma sessão do banco por request.

    Equivale ao @Autowired de um EntityManager no Spring:
    o FastAPI injeta automaticamente via Depends(get_db).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
