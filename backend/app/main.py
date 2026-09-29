from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
import app.models  # noqa: F401 — registra todas as tabelas no Base.metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Evento de startup: cria as tabelas no banco (dev only)."""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas criadas/verificadas com sucesso.")
    except Exception as e:
        print(f"⚠️  Não foi possível conectar ao banco: {e}")
        print("   O servidor vai subir, mas os endpoints que usam o banco vão falhar.")
    yield


app = FastAPI(
    title="Campeonato Amador API",
    description="Sistema de Gerenciamento de Campeonatos Amadores de Futebol",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — permite que o frontend React (Vite) faça requisições ao backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Routers ===
from app.routers import auth_router

app.include_router(auth_router.router, prefix="/api/auth", tags=["Autenticação"])

# Os demais serão ativados conforme forem criados:
# app.include_router(campeonato_router.router, prefix="/api/campeonatos", tags=["Campeonatos"])


@app.get("/", tags=["Health Check"])
def raiz():
    """Health check — confirma que a API está no ar."""
    return {"status": "ok", "mensagem": "API do Campeonato Amador"}
