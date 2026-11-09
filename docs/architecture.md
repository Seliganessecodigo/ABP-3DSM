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

## Arquitetura — c343698

React 19/TypeScript/Vite apresenta os dados; NestJS/TypeORM/PostgreSQL 18 integra e persiste. Somente o backend acessa fontes auxiliares. Controllers tratam transporte, services coordenam casos de uso, adapters validam fontes e repositories persistem. Autenticação e papéis usam guards globais; `PublicRoute` explicita exceções públicas. Preferências pertencem ao usuário autenticado; auditoria fica em `backend/src/shared/audit/` e compartilha a transação das mutações bem-sucedidas.

O dashboard e as consultas ambientais são públicos. Em `/login`, use e-mail/senha ou Google quando habilitado. Admin precisa configurar ou confirmar TOTP de seis dígitos antes da sessão, inclusive após Google. Analyst e Visitor não recebem autorização administrativa. O frontend mantém a sessão em memória; recarregar exige novo login. O backend valida JWT, sessão, papel e estado atuais; credencial ausente/inválida resulta em 401, papel insuficiente em 403. Novas rotas são protegidas por padrão.

A API permite a Admin da mesma organização alterar contas entre `ACTIVE`, `BLOCKED` e `DEACTIVATED`, com `expectedStatus` e motivo obrigatório. Bloqueio/desativação revogam todas as sessões; reativação exige novo login. Há proteção da própria conta e do último Admin ativo. Estado esperado divergente retorna 409; estado desejado já alcançado é sucesso idempotente. A auditoria compartilhada grava sucesso na transação da alteração e negações fora da transação revertida, com ator explícito e sem segredos. Gestão completa de papéis e recuperação de senha não estão entregues por essa rota.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
