# Preferências pessoais de Metodologia

Escopo autorizado: página `/methodology`, edição por aba, persistência por usuário e padrões de abertura no detalhe. A autenticação existente (SSO, TOTP do Admin e renovação de sessão) é reutilizada.

## Contrato HTTP

`GET /me/preferences` e `PUT /me/preferences/:tab` exigem o `AuthenticationGuard` existente. Admin, Analyst e Visitor autenticados consultam/alteram **somente suas próprias preferências de apresentação**. Isso não concede acesso à configuração do sistema. A identidade vem do principal validado no backend, nunca de parâmetros ou corpo. JWT inválido, sessão revogada e usuário inativo/removido seguem as regras de autenticação existentes.

O GET retorna `energy`, `emissions`, `coverage`, `analysis`. Cada propriedade é `null` quando nunca foi salva, ou `{ value, revision, updatedAt }`. Ausência não cria limites padrão. A revisão inicia em 1 e o instante RFC 3339 é emitido pelo servidor.

O PUT substitui **apenas uma aba** e recebe `{ expectedRevision, value }`. Revisão esperada 0 cria uma preferência ausente; atualizações exigem a revisão lida.

| Aba | `value` |
| --- | --- |
| `energy` | `{ threshold: number, alertsEnabled: boolean, scope: "application", referencePeriod: "month", unit: "kWh" }` |
| `emissions` | `{ threshold: number, alertsEnabled: boolean, scope: "application", referencePeriod: "month", unit: "kgCO2e" }` |
| `coverage` | `{ thresholdPercent: number, alertsEnabled: boolean }` |
| `analysis` | `{ periodDays: 7 \| 30, granularity: "hour" \| "day" }` |

Limites são finitos e não negativos; percentuais aceitam 0 a 100, incluindo as bordas. Não há teto ambiental arbitrário. Campos desconhecidos, unidades incompatíveis, strings numéricas e corpos parciais são rejeitados. Escopo, unidade e período fixos correspondem às opções do desenho aprovado; não são criadas conversões ou outras opções.

Respostas: `200` com preferência salva, `400 INVALID_PREFERENCE`, `401` conforme autenticação existente, `409 PREFERENCE_CONFLICT` para revisão desatualizada e `503 PREFERENCES_UNAVAILABLE` para falha de persistência. Falha nunca equivale a sucesso, ausência ou zero. O OpenAPI é gerado pelos DTOs/decorators do módulo.

## Persistência

A migration `UserPreferences1793200000000` cria `user_preferences`, com chave por usuário/aba, JSONB, revisão e instante. Não há seed com números do Figma. Escrita, revisão e auditoria antes/depois ocorrem na mesma transação. A trava no usuário serializa inclusive primeiras gravações concorrentes. A auditoria mantém ator, aba, valores, revisão, motivo, resultado e timestamp; a retenção de autoria segue a relação opcional com usuário já existente.

Execute as migrations habituais antes de iniciar o backend. A reversão remove esta tabela e as preferências salvas; a auditoria permanece.

## Interface

A consulta permanece pública. Sem sessão, o editor e as prévias podem ser explorados; salvar pede login e não grava dados. Com sessão, a preferência ativa só muda após sucesso. Cancelar restaura o valor ativo ou o exemplo quando não houver preferência. A troca de aba com edição pendente permite continuar, descartar e trocar ou salvar e trocar. Erros mantêm valor ativo, edição e aba de origem. Após conflito, cancelar recarrega a revisão atual. Requisições são canceladas ao desmontar/trocar usuário.

No detalhe, período e granularidade salvos preenchem somente parâmetros ausentes na URL. Escolhas feitas durante o carregamento também prevalecem. Falha nessa consulta mantém a análise pública utilizável com os padrões existentes; não modifica resultados ambientais.

Tabelas e gráfico de Metodologia contêm **dados de exemplo**, identificados na interface. Limites controlam os avisos combinados dessas prévias, separados do estado operacional. Esta tarefa não altera o contrato do catálogo real nem cria agregações mensais, fatores, fórmulas, métricas ou notificações externas. Aplicar esses limites em outras telas exige respeitar o período e o contrato de dados da tela. A metodologia histórica permanece em `/services/:id/methodology`, preservando `collectionId`, resultados e estados de erro/ausência.

## Verificação

Use `TEST_DATABASE_URL` exclusivamente com PostgreSQL isolado. O teste aplica migrations e cria/remove seus próprios usuários.

```sh
npm test -- --runInBand --runTestsByPath src/modules/preferences/preferences.service.spec.ts src/modules/preferences/preferences.database.spec.ts
npm run test:cov -- --runInBand
```

O teste HTTP usa JWT/sessão reais, cobrindo os três papéis, isolamento, usuário inativo, concorrência e auditoria. Os testes unitários cobrem validação, limites, ausência, sucesso e falhas. A suíte frontend `e2e/methodology-preferences.spec.ts` usa respostas HTTP controladas para validar edição, diálogo, falhas e responsividade; não substitui o teste com PostgreSQL.
