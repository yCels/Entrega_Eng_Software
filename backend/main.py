from fastapi import FastAPI

app = FastAPI(title="Campeonato Amador API")


@app.get("/")
def raiz():
    return {"status": "ok"}