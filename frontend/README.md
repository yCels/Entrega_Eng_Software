# Frontend — Nexum

Interface web do sistema de gerenciamento de campeonatos amadores de futebol.

## Tecnologias

- React 19 + TypeScript
- Vite
- React Router
- CSS Modules

## Como rodar

Com o backend rodando em `http://localhost:8000`:

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. Para apontar para outra API, crie um `.env` a partir do `.env.example` e ajuste a `VITE_API_URL`.

## Estrutura

- `src/api` — chamadas à API (o cookie de login vai em todas as requisições)
- `src/components` — componentes reutilizáveis (`ui/`) e seções das telas (campeonatos, times, jogadores, partidas e classificação)
- `src/layouts` — estrutura das telas
- `src/pages` — telas do sistema
- `src/hooks` — hooks compartilhados, como o tema claro/escuro
- `src/utils` — funções auxiliares

## Verificação

```bash
npx tsc -b
npm run lint
```
