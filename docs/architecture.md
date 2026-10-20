# Arquitetura

## Componentes

O ambiente local usa Docker Compose e três serviços: frontend, API e PostgreSQL.

| Área | Responsabilidade | Tecnologias |
| --- | --- | --- |
| `frontend/` | Interface, navegação e apresentação | React 19, TypeScript, Vite, i18next |
| `backend/` | API, casos de uso e integrações externas | NestJS, TypeScript, TypeORM |
| PostgreSQL | Persistência de aplicações e dados do domínio | PostgreSQL 18 |

O frontend chama apenas a API GreenER. Somente o backend acessa o Agregador de Métricas e o Serviço de Intensidade de Carbono.

## Organização do código

- `frontend/src/pages/` mantém cada tela com seus hooks, traduções e CSS Modules.
- `frontend/src/features/` mantém contratos, validação, acesso HTTP, cache e regras puras do domínio.
- `backend/src/modules/` contém casos de uso e endpoints agrupados por domínio.
- `backend/src/integrations/` adapta e valida as respostas das APIs auxiliares.
- `backend/src/database/` mantém entidades, migrations e repositories.

## Dados e confiabilidade

O backend é responsável por integrar fontes e persistir dados. Contratos, schemas e unidades documentados devem ser respeitados. Erro, ausência, resposta inválida e dado desatualizado são estados diferentes de zero válido; as telas devem preservar essa distinção.

Consulte os [contratos das APIs externas no repositório](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) e a [organização do frontend](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/frontend/src/README.md) para detalhes de implementação.

## Leitura de apoio

[Metodologia e dados](./product/methodology) · [Referência da API](./reference/api) · [Operação e diagnóstico](./operations)
