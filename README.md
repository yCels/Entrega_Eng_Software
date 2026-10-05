# Nexum — Gerenciamento de Campeonatos Amadores de Futebol

Sistema web para organizar campeonatos amadores de futebol: o organizador cria o campeonato, cadastra os times e jogadores, agenda as partidas e registra os resultados. A classificação é sempre calculada a partir dos eventos das partidas, nunca digitada.

Projeto da disciplina de **Laboratório de Engenharia de Software** — FATEC São José dos Campos.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Backend | Python + FastAPI (Pydantic e SQLAlchemy) |
| Frontend | React + TypeScript (Vite) |
| Banco de dados | PostgreSQL |
| Autenticação | JWT |
| Metodologia | Kanban (Jira) |

## Como rodar

O backend e o frontend rodam separados. Instruções completas em:

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)

Com os dois rodando, acesse `http://localhost:5173`. A documentação da API fica em `http://localhost:8000/docs`.

## Requisitos

| Requisito | Situação |
| --- | --- |
| RF — Criar campeonatos, cadastrar times e jogadores | ✅ Campeonatos e times na interface; jogadores na API |
| RF — Agendar partidas sem conflito de horário/local ou de time | ✅ Na API |
| RF — Registrar placares e eventos das partidas | 🔄 Próxima entrega |
| RF — Gerar a tabela de classificação | 🔄 Próxima entrega |
| RNF — Restrições UNIQUE e validação transacional | ✅ UNIQUE e CHECK no banco, rollback nos services |
| RNF — Builder Pattern na geração do calendário | 🔄 Próxima entrega |
| RNF — Service Layer | ✅ Regras de negócio na camada de services |
| RNF — Bloqueio de conflitos de agenda no backend | ✅ No service e no banco |
| RNF — Tabela ordenada por pontos e saldo | 🔄 Próxima entrega |

## Estrutura do repositório

```
backend/    API em FastAPI (models, schemas, services e routers)
frontend/   Interface em React
docs/       Backlog do projeto
```

## Organização do trabalho

- Backlog no [Jira](https://matheusdisabatino.atlassian.net/jira/software/projects/FUT/boards/2), com épicos e stories ([BACKLOG.MD](docs/BACKLOG.MD)).
- Uma branch por tarefa, saindo da `dev`, com prefixo `front/` ou `back/`.
- Integração por Pull Request para a `dev`, com revisão do outro integrante.
- A cada entrega, a `dev` é mergeada na `main`.
- Commits no padrão Conventional Commits (`feat`, `fix`, `refactor`, `chore`).

## Integrantes

| Nome | Responsabilidade | GitHub |
| --- | --- | --- |
| Matheus Di Sabatino Pires | Frontend | [@matheuspires7](https://github.com/matheuspires7) |
| Celso Moreira Freitas | Backend | [@yCels](https://github.com/yCels) |

**FATEC São José dos Campos** — Análise e Desenvolvimento de Sistemas