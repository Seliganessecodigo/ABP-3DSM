# GreenER

**[Acessar a documentação completa em HTML](https://seliganessecodigo.github.io/ABP-3DSM/)**

Plataforma acadêmica para acompanhar aplicações e estimar consumo de energia e emissões equivalentes de CO₂ (CO₂e).

## Visão geral

O GreenER reúne métricas de aplicações e apresenta indicadores com período, unidade e contexto. O sistema distingue dados válidos de ausência, erro e observações desatualizadas.

O frontend oferece catálogo, detalhe operacional, evidências de métricas, análise ambiental por aplicação e uma página que explica a metodologia registrada para cada coleta. O backend disponibiliza descoberta, coleta periódica, incidentes, consultas ambientais por aplicação e um endpoint de resumo agregado. O resumo agregado está disponível na API, sem tela própria. A [visão do produto](docs/product/vision.md) registra o estado por camada e a data de referência.

## Épicos

- [EP00 — Fundações técnicas, qualidade e processo de entrega](https://github.com/Seliganessecodigo/ABP-3DSM/issues/99)
- [EP01 — Catálogo de Aplicações](https://github.com/Seliganessecodigo/ABP-3DSM/issues/1)
- [EP02 — Monitoramento de Aplicações](https://github.com/Seliganessecodigo/ABP-3DSM/issues/2)
- [EP03 — Cálculo de Impacto Ambiental](https://github.com/Seliganessecodigo/ABP-3DSM/issues/3)
- [EP04 — Dashboard Ambiental](https://github.com/Seliganessecodigo/ABP-3DSM/issues/4)
- [EP05 — Análise e Simulação](https://github.com/Seliganessecodigo/ABP-3DSM/issues/5)
- [EP06 — Configuração e Administração](https://github.com/Seliganessecodigo/ABP-3DSM/issues/6)

## Documentação multilíngue

O conteúdo-fonte está em Markdown neste repositório. O site estático oferece navegação, pesquisa e seletor para português brasileiro, inglês, espanhol, francês, alemão, italiano, japonês e chinês simplificado.

Para conhecer o produto, comece pela [visão e escopo](docs/product/vision.md), pelo [guia de uso](docs/guide/monitoring.md) e pela [metodologia dos dados](docs/product/methodology.md). A documentação também cobre [qualidade e aceite](docs/product/quality.md), [decisões pendentes](docs/product/decisions.md), [API](docs/reference/api.md) e [operação](docs/operations.md), com páginas equivalentes nos oito idiomas.

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

## Tecnologias

React 19, TypeScript, Vite, i18next, NestJS, TypeORM, PostgreSQL, Docker Compose, Playwright, Jest e SonarQube Cloud.

## Contribuição

As issues do GitHub organizam épicos, histórias e tarefas. O trabalho parte de `develop` e é enviado por pull request para `develop`, seguindo Conventional Commits. Consulte [`AGENTS.md`](AGENTS.md) e as [diretrizes de frontend](skills/frontend/SKILL.md) e [backend](skills/backend/SKILL.md).

## 👥 Equipe

<div align="center">
  <table>
    <tr>
      <th>Membro</th>
      <th>Função</th>
      <th>GitHub</th>
      <th>LinkedIn</th>
    </tr>
    <tr>
      <td>Gianluca Lourenço Alves</td>
      <td>Product Owner</td>
      <td><a href="https://github.com/GianlucaAlves"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub de Gianluca Lourenço Alves"></a></td>
      <td><a href="https://www.linkedin.com/in/gianluca-alves"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn de Gianluca Lourenço Alves"></a></td>
    </tr>
    <tr>
      <td>Guilherme Oliveira</td>
      <td>Scrum Master</td>
      <td><a href="https://github.com/guioliv3"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub de Guilherme Oliveira"></a></td>
      <td><a href="https://www.linkedin.com/in/guilherme-henrique-de-oliveira-97076535b"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn de Guilherme Oliveira"></a></td>
    </tr>
    <tr>
      <td>Victor Coutinho</td>
      <td>Desenvolvedor</td>
      <td><a href="https://github.com/Vitaixs"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub de Victor Coutinho"></a></td>
      <td>—</td>
    </tr>
    <tr>
      <td>Lucas Cecon</td>
      <td>Desenvolvedor</td>
      <td><a href="https://github.com/lucas-cecon"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub de Lucas Cecon"></a></td>
      <td>—</td>
    </tr>
    <tr>
      <td>Breno</td>
      <td>Desenvolvedor</td>
      <td>—</td>
      <td>—</td>
    </tr>
  </table>
</div>
