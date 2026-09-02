# Backlog do Projeto — Sistema de Gerenciamento de Campeonatos Amadores de Futebol

Backlog em formato de user stories, ordenado por rank (ordem de execução
sugerida, respeitando as dependências entre as partes do sistema) e com
prioridade atribuída (Alta / Média / Baixa).

Stack: Python (FastAPI) no backend, React (TypeScript) no frontend, PostgreSQL
como banco de dados.

---

## Modelagem e Infraestrutura

| Rank | User Story | Prioridade |
| --- | --- | --- |
| 1 | Como equipe de desenvolvimento, quero ter as entidades do sistema modeladas (usuário, campeonato, time, jogador, partida, evento de partida), para que o banco de dados reflita corretamente as regras do domínio. | Alta |
| 2 | Como equipe de desenvolvimento, quero o backend conectado ao PostgreSQL, para que os dados sejam persistidos de forma confiável. | Alta |
| 3 | Como equipe de desenvolvimento, quero o projeto FastAPI estruturado em camadas (models, schemas, services, routers), para que o código fique de fácil manutenção. | Alta |
| 4 | Como equipe de desenvolvimento, quero as tabelas criadas no banco de dados a partir dos models, para que a aplicação tenha onde persistir os dados. | Alta |

## Autenticação de Usuários

| Rank | User Story | Prioridade |
| --- | --- | --- |
| 5 | Como organizador, quero me cadastrar no sistema com nome, email e senha, para que eu possa criar minha conta. | Alta |
| 6 | Como organizador, quero fazer login com email e senha, para que eu acesse meus campeonatos com segurança. | Alta |
| 7 | Como organizador, quero que minhas informações fiquem protegidas por autenticação (JWT), para que apenas eu tenha acesso aos meus dados. | Alta |
| 8 | Como organizador, quero visualizar e gerenciar apenas os campeonatos que eu mesmo criei, para que meus dados não se misturem com os de outros usuários. | Alta |

## Gestão de Campeonatos

| Rank | User Story | Prioridade |
| --- | --- | --- |
| 9 | Como organizador, quero criar um novo campeonato informando nome e data de início, para que eu possa começar a organizá-lo. | Alta |
| 10 | Como organizador, quero listar todos os meus campeonatos, para que eu tenha uma visão geral de tudo que estou organizando. | Alta |
| 11 | Como organizador, quero editar ou excluir um campeonato, para que eu possa corrigir informações ou remover um campeonato encerrado por engano. | Média |
| 12 | Como organizador, quero que o campeonato tenha um status (em andamento / encerrado), para que eu saiba rapidamente a situação de cada um. | Média |

## Gestão de Times e Jogadores

| Rank | User Story | Prioridade |
| --- | --- | --- |
| 13 | Como organizador, quero cadastrar os times participantes de um campeonato, para que eu possa organizar quem vai disputar. | Alta |
| 14 | Como organizador, quero listar, editar e excluir os times de um campeonato, para que eu possa manter a informação sempre correta. | Média |
| 15 | Como organizador, quero cadastrar os jogadores de cada time, para que eu possa registrar o elenco completo. | Alta |
| 16 | Como organizador, quero listar, editar e excluir jogadores de um time, para que o elenco fique sempre atualizado. | Média |

## Agendamento de Partidas

| Rank | User Story | Prioridade |
| --- | --- | --- |
| 17 | Como organizador, quero agendar uma partida entre dois times de um campeonato, informando data, horário e local, para que o confronto fique registrado. | Alta |
| 18 | Como organizador, quero que o sistema impeça agendar duas partidas no mesmo horário e local, para que não haja conflito de agenda. | Alta |
| 19 | Como organizador, quero que o sistema impeça um time de ter duas partidas marcadas no mesmo horário, para que a agenda de cada time seja respeitada. | Alta |
| 20 | Como equipe de desenvolvimento, quero uma restrição de unicidade no banco de dados, para que o conflito de agenda seja bloqueado mesmo em caso de falha na validação da aplicação. | Média |

## Registro de Eventos e Resultados

| Rank | User Story | Prioridade |
| --- | --- | --- |
| 21 | Como organizador, quero registrar os eventos de uma partida (gols e cartões) vinculados a um jogador, para que o histórico da partida fique completo. | Alta |
| 22 | Como organizador, quero que o placar da partida seja calculado automaticamente a partir dos eventos de gol registrados, para que eu não precise digitar o resultado manualmente. | Alta |

## Cálculo da Classificação

| Rank | User Story | Prioridade |
| --- | --- | --- |
| 23 | Como organizador, quero visualizar a tabela de classificação do campeonato, para que eu acompanhe a posição de cada time. | Alta |
| 24 | Como organizador, quero que a classificação seja calculada automaticamente (pontos, vitórias, empates, derrotas, saldo de gols), para que eu não precise calcular manualmente. | Alta |
| 25 | Como organizador, quero que o desempate entre times seja feito pelo saldo de gols, para que a ordenação da tabela siga um critério claro. | Média |

## Padrões de Projeto e Arquitetura (Requisitos Não Funcionais)

| Rank | User Story | Prioridade |
| --- | --- | --- |
| 26 | Como equipe de desenvolvimento, quero a lógica de negócio separada em uma camada de serviço (Service Layer), para que o código fique organizado e testável. | Média |
| 27 | Como equipe de desenvolvimento, quero aplicar o Builder Pattern na geração de partidas/calendário, para que o requisito de padrão de projeto do professor seja atendido. | Média |

## Frontend — Telas e Navegação

| Rank | User Story | Prioridade |
| --- | --- | --- |
| 28 | Como organizador, quero uma tela de login e cadastro, para que eu acesse o sistema pelo navegador. | Alta |
| 29 | Como organizador, quero uma tela de listagem e criação de campeonatos, para que eu gerencie meus campeonatos visualmente. | Alta |
| 30 | Como organizador, quero telas para gerenciar times e jogadores, para que eu não precise mexer diretamente na API. | Alta |
| 31 | Como organizador, quero uma tela de agendamento de partidas que me avise claramente quando houver conflito de agenda, para que eu entenda o motivo do erro. | Alta |
| 32 | Como organizador, quero uma tela para lançar os eventos de uma partida, para que eu registre gols e cartões de forma simples. | Alta |
| 33 | Como organizador, quero uma tela de classificação sempre atualizada, para que eu acompanhe o campeonato visualmente. | Alta |

## Integração entre Frontend e Backend

| Rank | User Story | Prioridade |
| --- | --- | --- |
| 34 | Como equipe de desenvolvimento, quero definir o contrato de comunicação entre frontend e backend, para que os dois lados sejam desenvolvidos em paralelo sem divergência. | Alta |
| 35 | Como equipe de desenvolvimento, quero substituir os dados simulados (mocks) pela API real, para que o sistema funcione de ponta a ponta. | Alta |
| 36 | Como equipe de desenvolvimento, quero testar o sistema completo integrado, para que eu tenha confiança de que tudo funciona antes da entrega. | Alta |

## Preparação para a Entrega

| Rank | User Story | Prioridade |
| --- | --- | --- |
| 37 | Como equipe de desenvolvimento, quero preparar dados de exemplo no sistema, para que a demonstração não seja feita com o banco vazio. | Média |
| 38 | Como equipe de desenvolvimento, quero revisar o sistema em busca de falhas, para que a apresentação ocorra sem imprevistos. | Média |
| 39 | Como equipe de desenvolvimento, quero ensaiar a apresentação final, para que a explicação do projeto fique clara para o professor. | Baixa |
| 40 | Como organizador, quero que as telas se ajustem bem a diferentes tamanhos de tela, para que o sistema seja usável tanto no computador quanto no celular. | Baixa |
