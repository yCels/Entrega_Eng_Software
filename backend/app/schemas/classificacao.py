from pydantic import BaseModel


class LinhaClassificacao(BaseModel):
    posicao: int
    time_id: int
    time_nome: str
    pontos: int
    jogos: int
    vitorias: int
    empates: int
    derrotas: int
    gols_pro: int
    gols_contra: int
    saldo_gols: int
