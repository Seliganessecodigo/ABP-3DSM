# GreenER backend

NestJS/TypeScript com TypeORM e PostgreSQL 18. O fluxo local completo é iniciado na raiz com cópia de `.env.example` para `.env` e `npm run dev`; consulte [primeiros passos](../docs/getting-started.md). O Compose aplica migrations e inicia a API; não há usuário/senha administrativos universais.

## Responsabilidades

- `src/modules/`: controllers/DTOs para HTTP, services para casos de uso, repositories para persistência e providers registrados por DI.
- `src/integrations/`: contratos e adapters de métricas/intensidade, validação de payload, timeout/retry e snapshots de fatores.
- `src/database/`: entidades, configuração TypeORM, migrations e repositories compartilhados. Sem synchronize automático em produção.
- `src/shared/audit/`: auditoria de mutações relevantes, compartilhando transação com mudanças bem-sucedidas e preservando autoria.
- `test/`: harness do fluxo integrado e fontes HTTP controladas. Testes `*.spec.ts` ficam junto do código.

Leituras analíticas especializadas usam SQL parametrizado pelo `EntityManager` dentro dos repositories, com schemas/migrations, inserções, atualizações e transações pelo TypeORM. Isso evita parâmetros excessivos e permite preservar intervalos/snapshots; as responsabilidades estão documentadas na [arquitetura](../docs/architecture.md). Os repositories concentram essas operações, mantendo a separação entre transporte HTTP, regras dos casos de uso e persistência.

## Executar e verificar

Dentro de `backend/`, com Node.js 24 e variáveis de ambiente configuradas:

```sh
npm ci
npm run lint
npm run typecheck
npm run build
npm test -- --runInBand
npm run test:cov -- --runInBand
```

`TEST_DATABASE_URL` precisa apontar para PostgreSQL **isolado** para executar as suítes de banco. Sem ela, essas suítes são ignoradas; isso não comprova integração. A CI cria banco temporário por migrations, executa os testes, publica LCOV e verifica o gate Sonar. Consulte [quality gates](../.github/quality-gates.md) e [harness integrado](test/README.md).

Preparação do banco com os comandos existentes:

```sh
npm run migration:run
npm run migration:show
```

O data source desses comandos carrega `.env` da raiz; use `DATABASE_URL` demonstrativa local conforme `.env.example`, nunca a conexão de produção em testes. O Compose usa os comandos de produção de migrations antes de iniciar a API. Swagger fica em `/docs`, contrato em `/openapi.json` e health em `/health`.

Autenticação, convites/SMTP, TOTP, SSO, recuperação de senha e controle de contas são documentados em `src/modules/authentication/` e nos ADRs de `docs/adr/`. O primeiro Admin é provisionado por convite, conforme [primeiros passos](../docs/getting-started.md); configuração de provedor Google e entrega real de e-mail dependem do ambiente.

## Integridade dos dados

Ausência, erro e stale não viram zero. Energia e CO₂e preservam modelo/fator e coberturas independentes. A taxa de sucesso das coletas contabiliza tentativas registradas com métricas válidas e salvas; não é cobertura temporal. Consulte [COLLECTION-SUCCESS.md](src/modules/applications/COLLECTION-SUCCESS.md), [contratos externos](src/integrations/EXTERNAL_API_CONTRACTS.md) e [referência HTTP](../docs/reference/api.md).
