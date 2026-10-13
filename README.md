# GreenER

Plataforma para acompanhar aplicações, estimar o consumo de energia e apresentar o impacto ambiental em CO₂ equivalente (CO₂e).

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS 11">
  <img src="https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 18">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Compose">
</p>

<p align="center">
  <a href="#produto">Produto</a> ·
  <a href="#epicos">Épicos</a> ·
  <a href="#arquitetura">Arquitetura</a> ·
  <a href="#tecnologias">Tecnologias</a> ·
  <a href="#primeiros-passos">Instalação</a> ·
  <a href="#documentacao">Documentação</a> ·
  <a href="#contribuicao">Contribuição</a>
</p>

---

## Produto

Aplicações em execução consomem recursos computacionais e energia. O GreenER reúne dados de aplicações e métricas operacionais para ajudar a acompanhar esse consumo e estimar as emissões associadas, mantendo visíveis o período, a localização e a qualidade dos dados usados.

O produto prevê um catálogo e detalhes por aplicação, monitoramento periódico, dados agregados, comparação e análise. O requisito é manter a consulta pública sem login e proteger alterações administrativas na API.

### Estado atual

O desenvolvimento é incremental e está organizado pelos épicos abaixo. No código atual, o frontend oferece catálogo de aplicações e página de detalhe, e o backend expõe a API do catálogo e a descoberta inicial de aplicações. As demais capacidades do produto estão vinculadas às histórias do backlog; sua inclusão aqui não significa que já estejam entregues.

## Épicos

Os épicos agrupam as histórias de usuário do produto. Critérios de aceite e tarefas específicas permanecem nas issues relacionadas.

| Épico | Escopo |
| --- | --- |
| [EP01 — Catálogo de Aplicações](https://github.com/Seliganessecodigo/ABP-3DSM/issues/1) | Consultar e navegar pelas aplicações |
| [EP02 — Monitoramento de Aplicações](https://github.com/Seliganessecodigo/ABP-3DSM/issues/2) | Descoberta, estados e coleta de aplicações |
| [EP03 — Cálculo de Impacto Ambiental](https://github.com/Seliganessecodigo/ABP-3DSM/issues/3) | Cálculo de energia e CO₂e |
| [EP04 — Dashboard Ambiental](https://github.com/Seliganessecodigo/ABP-3DSM/issues/4) | Indicadores e visão agregada |
| [EP05 — Análise e Simulação](https://github.com/Seliganessecodigo/ABP-3DSM/issues/5) | Comparações e cenários de análise |
| [EP06 — Configuração e Administração](https://github.com/Seliganessecodigo/ABP-3DSM/issues/6) | Configurações e administração do sistema |

## Arquitetura

O Docker Compose inicia o frontend, a API e o PostgreSQL. Apenas o backend integra com o Agregador de Métricas e o Serviço de Intensidade de Carbono; o frontend consome a API GreenER.

```text
frontend/   React, TypeScript, Vite e i18next
backend/    NestJS, TypeScript, TypeORM e integrações
PostgreSQL  persistência do catálogo e dos dados do domínio
```

No frontend, as telas ficam em `frontend/src/pages/`, com hooks, traduções e CSS Modules específicos. Componentes compartilhados, funcionalidades de domínio e estilos globais têm áreas próprias. No backend, módulos organizam casos de uso; adapters isolam APIs auxiliares e repositories isolam persistência.

O contrato das APIs externas e as regras para respostas incompletas, indisponibilidade e dados desatualizados estão documentados em [`backend/src/integrations/EXTERNAL_API_CONTRACTS.md`](backend/src/integrations/EXTERNAL_API_CONTRACTS.md). Falha ou ausência de dados não deve ser interpretada como consumo zero.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, i18next e react-i18next |
| Backend | NestJS 11, TypeScript, TypeORM e PostgreSQL |
| Execução local | Docker e Docker Compose |
| Testes | Playwright no frontend; Jest no backend |
| Qualidade | Oxlint no frontend, ESLint no backend e SonarQube Cloud na CI |

O frontend oferece português brasileiro, inglês, espanhol, francês, alemão, italiano, japonês e chinês simplificado. O inglês é o fallback para traduções ausentes.

## Primeiros passos

### Pré-requisitos

- Docker Desktop com Docker Compose v2 (`docker compose`).
- Node.js 24 ou superior e npm para executar comandos auxiliares fora dos containers.

### Executar com Docker Compose

Clone o repositório e entre na pasta:

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

Não é necessário instalar as dependências na raiz: os containers usam os lockfiles do frontend e do backend. Copie o arquivo de configuração local:

```powershell
Copy-Item .env.example .env
```

No macOS ou Linux:

```sh
cp .env.example .env
```

Inicie os serviços:

```sh
npm run dev
```

O Compose constrói e inicia frontend, API e PostgreSQL. As migrations pendentes são executadas antes de a API iniciar. A API tenta descobrir aplicações no início; se o agregador estiver indisponível, ela continua iniciando e registra a falha nos logs.

| Serviço | Endereço local |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Documentação OpenAPI | http://localhost:3000/docs |
| Healthcheck da API | http://localhost:3000/health |
| PostgreSQL | localhost:5432 |

Os valores de `.env.example` são apenas para desenvolvimento local. Ajuste as portas no `.env` se já estiverem ocupadas e nunca versione credenciais reais.

### Comandos úteis

| Comando | Ação |
| --- | --- |
| `npm run dev` | Construir e iniciar os serviços em primeiro plano |
| `npm run dev:detached` | Iniciar em segundo plano |
| `npm run dev:logs` | Acompanhar os logs |
| `npm run dev:down` | Parar os containers mantendo os dados persistidos |
| `docker compose up --build` | Reconstruir as imagens após mudanças de dependências ou Dockerfiles |

### Solução de problemas

- Se Docker não for encontrado, inicie o Docker Desktop e confirme `docker compose version`.
- Se uma porta estiver ocupada, ajuste `FRONTEND_PORT`, `API_PORT` ou `POSTGRES_PORT` no `.env`.
- Se a API não ficar saudável, consulte `npm run dev:logs`; ela depende do PostgreSQL e executa migrations antes de iniciar.
- Para repetir a descoberta de aplicações sem reiniciar a API, use `docker compose exec api npm run applications:discover`.

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [Organização do frontend](frontend/src/README.md) | Responsabilidades das pastas e como adicionar uma tela |
| [README do frontend](frontend/README.md) | Catálogo, internacionalização e testes do frontend |
| [Internacionalização](docs/frontend-i18n.md) | Organização das traduções e locales |
| [Contratos das APIs externas](backend/src/integrations/EXTERNAL_API_CONTRACTS.md) | Schemas, unidades e regras de integração |
| [Implementação das integrações](backend/src/integrations/IMPLEMENTATION.md) | Fluxos atuais dos adapters e serviços |
| [ADR de snapshots de fatores](backend/src/integrations/ADR-CARBON-FACTOR-SNAPSHOTS.md) | Decisões sobre fatores regionais de carbono |
| [Quality gates](.github/quality-gates.md) | CI, cobertura e SonarQube Cloud |
| [Evidências visuais](docs/evidence/frontend-page-styles/README.md) | Capturas responsivas das telas atuais |

## Contribuição

O trabalho parte de `develop` e é entregue por pull request para `develop`, seguindo Conventional Commits. Cada PR deve indicar as issues relacionadas, decisões e limitações, verificações realmente executadas e evidências visuais quando houver mudanças de interface. Consulte [`AGENTS.md`](AGENTS.md), a [skill do frontend](skills/frontend/SKILL.md) e a [skill do backend](skills/backend/SKILL.md) para os padrões de implementação.

A CI executa verificações de frontend e backend e o gate SonarQube Cloud. A PR deve corrigir os apontamentos introduzidos antes de ser concluída.

---

Projeto acadêmico desenvolvido no contexto do ABP do curso de Desenvolvimento de Software Multiplataforma da Fatec Jacareí.
