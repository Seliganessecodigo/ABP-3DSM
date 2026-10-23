# GreenER

Plataforma acadêmica para acompanhar aplicações e estimar consumo de energia e emissões equivalentes de CO₂ (CO₂e).

## Visão geral

O GreenER reúne métricas de aplicações e apresenta indicadores com período, unidade e contexto. O sistema distingue dados válidos de ausência, erro e observações desatualizadas.

O frontend já oferece catálogo e detalhe de aplicações; o backend disponibiliza a API do catálogo e a descoberta inicial. Dashboard, cálculos ambientais, análise e administração continuam organizados no backlog.

## Épicos

- [EP01 — Catálogo de Aplicações](https://github.com/Seliganessecodigo/ABP-3DSM/issues/1)
- [EP02 — Monitoramento de Aplicações](https://github.com/Seliganessecodigo/ABP-3DSM/issues/2)
- [EP03 — Cálculo de Impacto Ambiental](https://github.com/Seliganessecodigo/ABP-3DSM/issues/3)
- [EP04 — Dashboard Ambiental](https://github.com/Seliganessecodigo/ABP-3DSM/issues/4)
- [EP05 — Análise e Simulação](https://github.com/Seliganessecodigo/ABP-3DSM/issues/5)
- [EP06 — Configuração e Administração](https://github.com/Seliganessecodigo/ABP-3DSM/issues/6)

## Documentação multilíngue

O conteúdo-fonte está em Markdown neste repositório. O site estático oferece navegação, pesquisa e seletor para português brasileiro, inglês, espanhol, francês, alemão, italiano, japonês e chinês simplificado.

| Idioma | Fonte Markdown |
| --- | --- |
| [Português (Brasil)](docs/index.md) | [Primeiros passos](docs/getting-started.md) · [Arquitetura](docs/architecture.md) · [Épicos](docs/roadmap.md) · [Contribuição](docs/contributing.md) |
| [English](docs/en-US/index.md) | [Getting started](docs/en-US/getting-started.md) · [Architecture](docs/en-US/architecture.md) · [Epics](docs/en-US/roadmap.md) · [Contributing](docs/en-US/contributing.md) |
| [Español](docs/es-ES/index.md) | [Inicio](docs/es-ES/getting-started.md) · [Arquitectura](docs/es-ES/architecture.md) · [Épicas](docs/es-ES/roadmap.md) · [Contribuir](docs/es-ES/contributing.md) |
| [Français](docs/fr-FR/index.md) | [Démarrage](docs/fr-FR/getting-started.md) · [Architecture](docs/fr-FR/architecture.md) · [Épopées](docs/fr-FR/roadmap.md) · [Contribuer](docs/fr-FR/contributing.md) |
| [Deutsch](docs/de-DE/index.md) | [Erste Schritte](docs/de-DE/getting-started.md) · [Architektur](docs/de-DE/architecture.md) · [Epics](docs/de-DE/roadmap.md) · [Mitwirken](docs/de-DE/contributing.md) |
| [Italiano](docs/it-IT/index.md) | [Per iniziare](docs/it-IT/getting-started.md) · [Architettura](docs/it-IT/architecture.md) · [Epic](docs/it-IT/roadmap.md) · [Contribuire](docs/it-IT/contributing.md) |
| [日本語](docs/ja-JP/index.md) | [はじめに](docs/ja-JP/getting-started.md) · [アーキテクチャ](docs/ja-JP/architecture.md) · [エピック](docs/ja-JP/roadmap.md) · [コントリビューション](docs/ja-JP/contributing.md) |
| [简体中文](docs/zh-CN/index.md) | [开始使用](docs/zh-CN/getting-started.md) · [架构](docs/zh-CN/architecture.md) · [史诗任务](docs/zh-CN/roadmap.md) · [参与贡献](docs/zh-CN/contributing.md) |

Para abrir o site localmente, instale as dependências da documentação e inicie o servidor:

```sh
npm ci --prefix docs
npm run docs:dev
```

Acesse http://localhost:4174. Para gerar e visualizar os arquivos HTML de produção, use `npm run docs:build` e `npm run docs:preview`.

A publicação do HTML no GitHub Pages está configurada no workflow. Na primeira publicação, o repositório precisa usar **GitHub Actions** como origem em **Settings → Pages**. O Markdown continua versionado e acessível pelos links acima.

## Executar a aplicação

### Pré-requisitos

- Docker Desktop com Docker Compose v2 (`docker compose`).
- Node.js 24 ou superior e npm.

Copie a configuração local:

```powershell
Copy-Item .env.example .env
```

No macOS ou Linux:

```sh
cp .env.example .env
```

Inicie frontend, API e PostgreSQL:

```sh
npm run dev
```

| Serviço | Endereço local |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| OpenAPI | http://localhost:3000/docs |
| Healthcheck | http://localhost:3000/health |
| PostgreSQL | localhost:5432 |

Os containers executam as migrations e tentam descobrir aplicações na inicialização. Se o agregador estiver indisponível, a API registra a falha e continua iniciando. Os valores de `.env.example` são somente para desenvolvimento local; não versione `.env` nem credenciais reais.

Comandos adicionais: `npm run dev:detached`, `npm run dev:logs` e `npm run dev:down`.

### Autenticação do backend

O backend oferece login por e-mail e senha, access JWT com validade de 15 minutos, refresh token rotativo e sessões revogáveis. Contas `ADMIN` precisam configurar e validar TOTP de seis dígitos (HMAC-SHA1, 30 segundos) antes de receber uma sessão normal; `ANALYST` e `VISITOR` continuam no fluxo atual. Configure `AUTH_JWT_SECRET`, `AUTH_PASSWORD_PEPPER` e uma chave TOTP AES-256-GCM externa ao banco, com pelo menos 32 bytes aleatórios e sem reutilização entre chaves. Os nomes de versão e o mapa `AUTH_TOTP_ENCRYPTION_KEYS` ficam em configuração externa. Para rodízio de pepper, informe `AUTH_PASSWORD_PEPPER_KEYS` como mapa JSON de versões ainda necessárias e `AUTH_PASSWORD_PEPPER_VERSION` como versão ativa; mantenha a chave `legacy` enquanto existirem hashes antigos sem versão. Configure também os dados SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` e, se necessário, `SMTP_USER`/`SMTP_PASSWORD`) e `APP_BASE_URL`; sem SMTP o envio do convite e da confirmação falha de forma explícita.

Com as migrations aplicadas, crie uma organização e envie o convite ao representante definindo `ORGANIZATION_NAME`, `ORGANIZATION_SLUG` e `ORGANIZATION_REPRESENTATIVE_EMAIL` no ambiente antes de executar `npm run organizations:create-invitation` em `backend/`. Para reenviar um convite de uma organização existente, omita `ORGANIZATION_NAME` e informe o slug e o e-mail do representante. O representante cadastra o primeiro Admin; o Admin confirma o próprio e-mail e define a senha nesse fluxo. Os endpoints e seus contratos estão publicados em `/docs`.

Para testar o login local sem SMTP, suba a API com `docker compose up -d api` e execute `docker compose exec api npm run auth:create-test-login`. O comando só funciona com `NODE_ENV=development`, cria/atualiza o usuário `login.teste@greener.test` na organização `greener-teste`, com papel `VISITOR`, e gera uma senha temporária no terminal. Use esses dados em `/login`; cada execução redefine a senha.

Para recuperar um autenticador perdido, o suporte deve validar a autoridade atual da organização por canal independente antes de operar. No backend, execute `npm run authentication:recover-admin-totp` com `ORGANIZATION_SLUG`, `ADMIN_EMAIL`, `NEW_RECOVERY_REPRESENTATIVE_EMAIL`, `SUPPORT_OPERATOR_ID` e `SUPPORT_RECOVERY_REASON` no ambiente. A operação redefine TOTP, atualiza o contato de recuperação, revoga as sessões e registra auditoria; não use edição manual do banco. O Admin deve autenticar novamente e configurar TOTP.

## Tecnologias

React 19, TypeScript, Vite, i18next, NestJS, TypeORM, PostgreSQL, Docker Compose, Playwright, Jest e SonarQube Cloud.

## Contribuição

As issues do GitHub organizam épicos, histórias e tarefas. O trabalho parte de `develop` e é enviado por pull request para `develop`, seguindo Conventional Commits. Consulte [`AGENTS.md`](AGENTS.md) e as [diretrizes de frontend](skills/frontend/SKILL.md) e [backend](skills/backend/SKILL.md).
