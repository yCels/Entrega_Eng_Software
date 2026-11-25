# Arquitetura

O Nexum é uma aplicação web em três partes: uma interface em React que roda no navegador, uma API REST em FastAPI e um banco PostgreSQL. O frontend nunca acessa o banco: toda leitura e gravação passa pela API, que concentra as regras de negócio.

## Visão geral

```mermaid
flowchart LR
    usuario(["Organizador"])

    subgraph navegador["Navegador"]
        spa["Frontend<br/>React + TypeScript (Vite)"]
    end

    subgraph servidor["Servidor"]
        api["API REST<br/>FastAPI + Pydantic"]
        db[("PostgreSQL<br/>campeonatos_db")]
    end

    usuario --> spa
    spa -- "HTTP + JSON<br/>cookie HttpOnly com o JWT" --> api
    api -- "SQLAlchemy (ORM)" --> db
```

| Parte | Tecnologia | Responsabilidade |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, CSS Modules | Telas, navegação, validação dos formulários e feedback (skeletons e toasts) |
| API | Python, FastAPI, Pydantic, SQLAlchemy | Autenticação, regras de negócio, validação e cálculo de placar e classificação |
| Banco | PostgreSQL | Persistência e restrições de integridade (UNIQUE, CHECK e chaves estrangeiras) |

### Autenticação

No login, a API devolve o JWT num **cookie HttpOnly**. O JavaScript da página não consegue ler esse cookie, e o navegador o envia sozinho em toda requisição (`credentials: 'include'`). O token não fica no `localStorage`. O CORS do backend libera só a origem do frontend (`http://localhost:5173`), com `allow_credentials`.

## Backend em camadas

Cada requisição atravessa as camadas sempre na mesma ordem. O router não tem regra de negócio, e o service não sabe nada de HTTP além de lançar `HTTPException`.

```mermaid
flowchart TB
    cliente["Frontend"]
    main["main.py<br/>cria o app, libera o CORS e registra os routers em /api"]

    subgraph http["Camada HTTP"]
        direction LR
        schemas["schemas/<br/>Pydantic valida a entrada<br/>e formata a saída"]
        routers["routers/<br/>auth, campeonato, time,<br/>jogador, partida, evento"]
        deps["core/dependencies.py<br/>get_current_user lê o JWT<br/>do cookie (core/security.py)"]
        schemas ~~~ routers ~~~ deps
    end

    subgraph negocio["Camada de serviço (Service Layer)"]
        direction LR
        builder["calendario_builder.py<br/>Builder Pattern"]
        services["services/<br/>regras de negócio, posse do<br/>recurso, conflitos de agenda"]
        classif["classificacao_service.py<br/>pontos e saldo pelos gols"]
        builder ~~~ services ~~~ classif
    end

    subgraph dados["Camada de dados"]
        direction LR
        models["models/<br/>SQLAlchemy: tabelas<br/>e relacionamentos"]
        transacao["core/transacao.py<br/>commit, ou rollback<br/>e erro 400"]
        database["database.py<br/>uma sessão por requisição"]
        models ~~~ transacao ~~~ database
    end

    db[("PostgreSQL")]

    cliente -- "HTTP + JSON" --> main --> http
    http -- "chama o service com os dados já validados" --> negocio
    negocio -- "lê e grava pelos models" --> dados
    dados -- "SQL" --> db
```

| Camada | Pasta | O que faz |
| --- | --- | --- |
| Routers | `routers/` | Declaram os endpoints, recebem a sessão do banco e o usuário logado por `Depends` e chamam o service |
| Schemas | `schemas/` | Pydantic valida o corpo da requisição (422 se inválido) e define o formato da resposta |
| Services | `services/` | Toda regra de negócio: o recurso precisa ser do organizador logado (senão 404), conflitos de agenda, campeonato encerrado, partida finalizada |
| Models | `models/` | Mapeamento das tabelas; o DER está em [DER.md](DER.md) |
| Core | `core/` | Segurança (hash e JWT), dependência de autenticação e gravação transacional |

### Padrões de projeto

- **Service Layer**: as regras ficam nos services, o que permite testá-las sem subir a API (`backend/tests/`).
- **Builder**: `CalendarioBuilder` monta o calendário passo a passo (`set_times`, `set_local`, `set_data_inicio`, `set_horario`, `set_intervalo_dias`, `set_duracao_jogo`, `set_ida_e_volta`), valida a configuração e só gera as partidas no `build()`. O `calendario_service` usa o builder e grava tudo numa transação só.
- **Injeção de dependência**: o FastAPI entrega a sessão do banco (`get_db`) e o usuário logado (`get_current_user`) para cada rota.

## Frontend

```mermaid
flowchart TB
    main["main.tsx + App.tsx<br/>rotas do React Router"]
    protegida["ProtectedRoute<br/>confere o login em /auth/me"]
    layouts["layouts/<br/>AppLayout (sidebar) e AuthLayout"]
    pages["pages/<br/>Welcome, Login, Register, Campeonatos, CampeonatoDetalhe"]
    components["components/<br/>campeonatos, times, jogadores, partidas, classificacao"]
    ui["components/ui/<br/>Button, Input, Select, Modal, Skeleton, Toast..."]
    apis["api/<br/>auth, campeonatos, times, jogadores, partidas, eventos, classificacao"]
    client["api/client.ts<br/>fetch com cookie, trata erros e 401"]
    backend["API FastAPI"]

    main --> protegida --> layouts --> pages --> components
    components --> ui
    pages --> apis
    components --> apis
    apis --> client -- "HTTP + JSON" --> backend
```

- Cada recurso da API tem um módulo em `src/api/` com funções tipadas; todos usam o `client.ts`, que monta a URL a partir de `VITE_API_URL`, envia o cookie e transforma o erro da API numa mensagem legível.
- Uma resposta 401 leva para a tela de login.
- O detalhe do campeonato reúne as seções de times, partidas e classificação; elenco, súmula e formulários abrem em modais.

## Exemplo de requisição: lançar um gol na súmula

```mermaid
sequenceDiagram
    autonumber
    actor org as Organizador
    participant front as Frontend (SumulaModal)
    participant router as evento_router
    participant auth as get_current_user
    participant service as evento_service
    participant db as PostgreSQL

    org->>front: escolhe time, jogador, "Gol" e minuto
    front->>router: POST /api/partidas/{id}/eventos (cookie com o JWT)
    router->>auth: valida o token do cookie
    auth-->>router: usuário logado (ou 401)
    Note over router: Pydantic valida o corpo (tipo no enum, minuto >= 0) ou responde 422
    router->>service: registrar(partida_id, dados, usuario_id)
    service->>db: busca a partida e o campeonato do organizador
    Note over service: partida de outro organizador: 404<br/>campeonato encerrado ou partida finalizada: 400<br/>time fora da partida ou jogador de outro time: 400
    service->>db: INSERT em eventos_partida + COMMIT
    db-->>service: evento gravado
    service-->>router: evento
    router-->>front: 201 com o evento
    front->>front: soma os gols e atualiza o placar e a lista de partidas
    front-->>org: toast "Gol lançado."
```

Só os eventos de partidas com `finalizada = true` entram na classificação, que é recalculada a cada consulta em `GET /api/campeonatos/{id}/classificacao`.

## Implantação com Docker

O `docker-compose.yml` na raiz sobe as três partes em containers:

```mermaid
flowchart LR
    nav["Navegador"]

    subgraph compose["docker compose"]
        front["frontend<br/>nginx com o build do Vite<br/>porta 5173 → 80"]
        back["backend<br/>uvicorn + FastAPI<br/>porta 8000"]
        pg[("db<br/>postgres:18<br/>porta 5432")]
        vol[["volume dados_postgres"]]
    end

    nav -- "páginas e arquivos estáticos" --> front
    nav -- "chamadas à API" --> back
    back -- "db:5432 (rede interna)" --> pg
    pg --- vol
```

- O navegador chama a API direto em `localhost:8000`: o nginx só serve os arquivos do frontend.
- O backend espera o banco aceitar conexões (healthcheck) antes de subir e cria as tabelas na inicialização.
- Os dados ficam no volume `dados_postgres` e sobrevivem a um `docker compose down`.
