# Backlog do Projeto — Sistema de Gerenciamento de Campeonatos Amadores de Futebol

Stack: Python (FastAPI) no backend, React (TypeScript) no frontend, PostgreSQL
como banco de dados.

Quadro Kanban: [Jira](https://matheusdisabatino.atlassian.net/jira/software/projects/FUT/boards/2)

**Legenda de status**

- ✅ Concluído — funcionando de ponta a ponta (backend e interface, quando houver tela)
- 🟡 Parcial — pronto no backend (API), interface nas próximas entregas
- ⬜ Pendente — em desenvolvimento

---

## Resumo da Entrega 1

- Estrutura do backend em camadas, banco PostgreSQL e autenticação com JWT
- Campeonatos e times funcionando de ponta a ponta (interface integrada à API)
- Jogadores, agendamento de partidas com bloqueio de conflito e eventos disponíveis na API
- Restrições UNIQUE e CHECK no banco e validação transacional com rollback

## Resumo da Entrega 2

Backend:

- Login com o JWT em cookie HttpOnly, com logout (o token não fica mais no `localStorage`)
- Classificação calculada automaticamente pelos eventos de gol, ordenada por pontos e saldo de gols
- Builder Pattern na geração automática do calendário (todos contra todos, com opção de ida e volta)
- Partidas: remarcação e exclusão com a mesma validação de conflito do agendamento
- Partida finalizada: só ela conta na classificação, e trava eventos e remarcação até ser reaberta
- Eventos: jogador precisa ser do time informado, tipo validado e exclusão de evento lançado errado
- Campeonato encerrado não aceita mais mudanças em times, jogadores, partidas e eventos
- Time com partidas não pode ser excluído
- 119 testes automatizados com pytest rodando no GitHub Actions a cada PR

Frontend:

- Skeletons durante o carregamento e toasts de confirmação e erro em todas as telas
- Elenco de cada time: cadastro, edição e exclusão de jogadores
- Agendamento de partida com aviso de conflito de horário e local na hora, antes de enviar
- Geração do calendário pelo Builder, com resumo de quantas partidas e rodadas vão sair
- Partidas agrupadas por rodada, navegando um dia por vez
- Menu de ações da partida: remarcar, finalizar, reabrir e excluir
- Súmula da partida: lançar gols e cartões por time, jogador e minuto, com placar automático e exclusão de evento
- Tabela de classificação atualizada assim que uma partida é finalizada ou reaberta

---

## Modelagem e Infraestrutura

| Rank | User Story | Prioridade | Status |
| --- | --- | --- | --- |
| 1 | Como equipe de desenvolvimento, quero ter as entidades do sistema modeladas (usuário, campeonato, time, jogador, partida, evento de partida), para que o banco de dados reflita corretamente as regras do domínio. | Alta | ✅ |
| 2 | Como equipe de desenvolvimento, quero o backend conectado ao PostgreSQL, para que os dados sejam persistidos de forma confiável. | Alta | ✅ |
| 3 | Como equipe de desenvolvimento, quero o projeto FastAPI estruturado em camadas (models, schemas, services, routers), para que o código fique de fácil manutenção. | Média | ✅ |
| 4 | Como equipe de desenvolvimento, quero as tabelas criadas no banco de dados a partir dos models, para que a aplicação tenha onde persistir os dados. | Alta | ✅ |

## Autenticação de Usuários

| Rank | User Story | Prioridade | Status |
| --- | --- | --- | --- |
| 5 | Como organizador, quero me cadastrar no sistema com nome, email e senha, para que eu possa criar minha conta. | Alta | ✅ |
| 6 | Como organizador, quero fazer login com email e senha, para que eu acesse meus campeonatos com segurança. | Alta | ✅ |
| 7 | Como organizador, quero visualizar e gerenciar apenas os campeonatos que eu mesmo criei, para que meus dados não se misturem com os de outros usuários. | Média | ✅ |

## Gestão de Campeonatos

| Rank | User Story | Prioridade | Status |
| --- | --- | --- | --- |
| 8 | Como organizador, quero criar um novo campeonato informando nome e data de início, para que eu possa começar a organizá-lo. | Alta | ✅ |
| 9 | Como organizador, quero listar todos os meus campeonatos, para que eu tenha uma visão geral de tudo que estou organizando. | Alta | ✅ |
| 10 | Como organizador, quero editar ou excluir um campeonato, para que eu possa corrigir informações ou remover um campeonato criado por engano. | Média | ✅ |
| 11 | Como organizador, quero que o campeonato tenha um status (em andamento / encerrado), para que eu saiba rapidamente a situação de cada um. | Baixa | ✅ |

## Gestão de Times e Jogadores

| Rank | User Story | Prioridade | Status |
| --- | --- | --- | --- |
| 12 | Como organizador, quero cadastrar os times participantes de um campeonato, para que eu possa organizar quem vai disputar. | Alta | ✅ |
| 13 | Como organizador, quero listar, editar e excluir os times de um campeonato, para que eu possa manter a informação sempre correta. | Média | ✅ |
| 14 | Como organizador, quero cadastrar os jogadores de cada time, para que eu possa registrar o elenco completo. | Alta | ✅ |
| 15 | Como organizador, quero listar, editar e excluir jogadores de um time, para que o elenco fique sempre atualizado. | Média | ✅ |

## Agendamento de Partidas

| Rank | User Story | Prioridade | Status |
| --- | --- | --- | --- |
| 16 | Como organizador, quero agendar uma partida entre dois times de um campeonato, informando data, horário e local, para que o confronto fique registrado. | Alta | ✅ |
| 17 | Como organizador, quero que o sistema impeça agendar duas partidas no mesmo horário e local, para que não haja conflito de agenda. | Alta | ✅ |
| 18 | Como organizador, quero que o sistema impeça um time de ter duas partidas marcadas no mesmo horário, para que a agenda de cada time seja respeitada. | Alta | ✅ |

## Registro de Eventos e Resultados

| Rank | User Story | Prioridade | Status |
| --- | --- | --- | --- |
| 19 | Como organizador, quero registrar os eventos de uma partida (gols e cartões) vinculados a um jogador, para que o histórico da partida fique completo. | Alta | ✅ |
| 20 | Como organizador, quero que o placar da partida seja calculado automaticamente a partir dos eventos de gol registrados, para que eu não precise digitar o resultado manualmente. | Alta | ✅ |

## Cálculo da Classificação

| Rank | User Story | Prioridade | Status |
| --- | --- | --- | --- |
| 21 | Como organizador, quero visualizar a tabela de classificação do campeonato, para que eu acompanhe a posição de cada time. | Alta | ✅ |
| 22 | Como organizador, quero que a classificação seja calculada automaticamente (pontos, vitórias, empates, derrotas, saldo de gols), para que eu não precise calcular manualmente. | Alta | ✅ |

## Padrões de Projeto e Arquitetura (Requisitos Não Funcionais)

| Rank | User Story | Prioridade | Status |
| --- | --- | --- | --- |
| 23 | Como equipe de desenvolvimento, quero a lógica de negócio separada em uma camada de serviço (Service Layer), para que o código fique organizado e testável. | Média | ✅ |
| 24 | Como equipe de desenvolvimento, quero aplicar o Builder Pattern na geração de partidas/calendário, para que o requisito de padrão de projeto do professor seja atendido. | Média | ✅ |

## Frontend — Telas e Navegação

| Rank | User Story | Prioridade | Status |
| --- | --- | --- | --- |
| 25 | Como organizador, quero uma tela de login e cadastro, para que eu acesse o sistema pelo navegador. | Alta | ✅ |
| 26 | Como organizador, quero uma tela de listagem e criação de campeonatos, para que eu gerencie meus campeonatos visualmente. | Alta | ✅ |
| 27 | Como organizador, quero telas para gerenciar times e jogadores, para que eu não precise mexer diretamente na API. | Alta | ✅ |
| 28 | Como organizador, quero uma tela de agendamento de partidas que me avise claramente quando houver conflito de agenda, para que eu entenda o motivo do erro. | Alta | ✅ |
| 29 | Como organizador, quero uma tela para lançar os eventos de uma partida, para que eu registre gols e cartões de forma simples. | Alta | ✅ |
| 30 | Como organizador, quero uma tela de classificação sempre atualizada, para que eu acompanhe o campeonato visualmente. | Alta | ✅ |

## Integração entre Frontend e Backend

| Rank | User Story | Prioridade | Status |
| --- | --- | --- | --- |
| 31 | Como equipe de desenvolvimento, quero definir o contrato de comunicação entre frontend e backend, para que os dois lados sejam desenvolvidos em paralelo sem divergência. | Média | ✅ |
| 32 | Como equipe de desenvolvimento, quero substituir os dados simulados (mocks) pela API real, para que o sistema funcione de ponta a ponta. | Alta | ✅ |
| 33 | Como equipe de desenvolvimento, quero testar o sistema completo integrado, para que eu tenha confiança de que tudo funciona antes da entrega. | Média | ✅ |

## Novos Requisitos da Entrega 2

| Rank | User Story | Prioridade | Status |
| --- | --- | --- | --- |
| 34 | Como organizador, quero que meu login fique guardado em um cookie HttpOnly, para que o token da minha sessão não fique exposto a scripts da página. | Alta | ✅ |
| 35 | Como organizador, quero ver um esqueleto da tela enquanto os dados carregam, para que eu saiba que o sistema está buscando as informações. | Média | ✅ |
| 36 | Como organizador, quero receber uma mensagem de confirmação ou de erro depois de cada ação, para que eu saiba se ela deu certo. | Média | ✅ |
| 37 | Como organizador, quero gerar o calendário completo pela tela, informando local, data, horário e se é ida e volta, para que eu não precise agendar partida por partida. | Alta | ✅ |
| 38 | Como organizador, quero navegar pelas partidas uma rodada por vez, para que a lista não fique longa demais. | Baixa | ✅ |
| 39 | Como organizador, quero remarcar ou excluir uma partida, com a mesma checagem de conflito do agendamento, para que eu consiga corrigir a agenda. | Média | ✅ |
| 40 | Como organizador, quero finalizar e reabrir uma partida, para que só os jogos encerrados contem na classificação. | Alta | ✅ |
| 41 | Como organizador, quero que um campeonato encerrado não aceite mais mudanças em times, jogadores, partidas e eventos, para que o resultado final fique preservado. | Média | ✅ |
| 42 | Como equipe de desenvolvimento, quero testes automatizados rodando a cada Pull Request, para que uma mudança não quebre o que já funcionava. | Média | ✅ |
| 43 | Como equipe de desenvolvimento, quero o DER e o diagrama de arquitetura atualizados no repositório, para que a estrutura do sistema fique documentada. | Alta | ⬜ |
| 44 | Como equipe de desenvolvimento, quero subir o sistema completo com Docker, para que qualquer pessoa consiga rodar o projeto com um comando. | Média | ⬜ |
