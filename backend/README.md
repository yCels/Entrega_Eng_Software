# Backend — Nexum

API REST do sistema de gerenciamento de campeonatos amadores de futebol.

## Tecnologias

- Python + FastAPI
- SQLAlchemy + PostgreSQL
- Pydantic (validação)
- JWT (python-jose) e bcrypt (passlib)

## Como rodar

1. Crie o banco `campeonatos_db` no PostgreSQL.
2. Se a senha do usuário `postgres` não for `postgres`, crie um arquivo `.env` nesta pasta:

```
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/campeonatos_db
```

3. Instale e rode:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

As tabelas são criadas automaticamente ao iniciar. A documentação interativa fica em `http://localhost:8000/docs`; para as rotas protegidas, basta chamar `POST /api/auth/login`: o token fica salvo num cookie HttpOnly e o navegador envia ele automaticamente nas próximas requisições.

## Arquitetura

```
app/
├── models/    entidades e tabelas do banco
├── schemas/   validação dos dados de entrada e saída (Pydantic)
├── services/  regras de negócio (conflito de agenda, permissões, transações)
├── routers/   endpoints da API, que apenas chamam os services
└── core/      segurança (JWT), usuário logado e controle de transação
```

## Regras de negócio

- Cada organizador só vê e altera os próprios campeonatos.
- Uma partida não pode ser agendada no mesmo horário e local de outra, nem com um time que já joga naquele horário. A regra é validada no service e reforçada no banco (`UNIQUE` em horário + local e `CHECK` para impedir um time contra ele mesmo).
- Toda gravação passa por `core/transacao.py`: se o banco recusar, a transação é desfeita (rollback) e a API devolve uma mensagem clara.

## Principais rotas

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/cadastro` | Cria uma conta |
| POST | `/api/auth/login` | Faz login e grava o JWT em cookie HttpOnly |
| POST | `/api/auth/logout` | Apaga o cookie e encerra a sessão |
| GET | `/api/auth/me` | Dados do usuário logado |
| GET/POST | `/api/campeonatos/` | Lista e cria campeonatos |
| GET/PUT/DELETE | `/api/campeonatos/{id}` | Detalhe, edição e exclusão |
| GET/POST | `/api/campeonatos/{id}/times` | Lista e cria times |
| PUT/DELETE | `/api/times/{id}` | Edita e exclui um time |
| GET/POST | `/api/campeonatos/{id}/partidas` | Lista e agenda partidas |
| POST | `/api/campeonatos/{id}/calendario` | Gera todas as partidas (todos contra todos) com o Builder Pattern |
| GET | `/api/partidas/{id}/placar` | Placar calculado pelos eventos de gol |
| GET | `/api/campeonatos/{id}/classificacao` | Tabela de classificação calculada |
