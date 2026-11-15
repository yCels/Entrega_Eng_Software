from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/campeonatos_db"
    SECRET_KEY: str = "chave-secreta-jwt-trocar-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # em produção (HTTPS) tem que ser True, senão o cookie anda sem criptografia
    COOKIE_SECURE: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
