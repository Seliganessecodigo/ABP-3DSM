# Preferências pessoais e avisos ambientais

`GET /me/preferences` e `PUT /me/preferences/:tab` exigem JWT e operam somente na conta autenticada. Cada aba retorna `null` ou `{ value, revision, updatedAt }`. O PUT recebe `{ expectedRevision, value }`; revisão 0 cria a preferência e divergência retorna `409 PREFERENCE_CONFLICT`. Formatos inválidos retornam `400 INVALID_PREFERENCE`; indisponibilidade retorna `503 PREFERENCES_UNAVAILABLE`.

## Períodos e valores

Todas as abas aceitam `period: { kind }`, com `kind` igual a `24h`, `7d`, `30d`, `90d` ou `month`. Janelas móveis terminam no instante da avaliação; mês começa no primeiro dia em UTC. Intervalos fixos usam `{ kind: "custom", from, to }`, com timestamps RFC 3339 incluindo fuso, início incluído e fim excluído, estritamente posterior ao início. A interface edita datas em UTC.

| Aba | Formato atual de `value` |
| --- | --- |
| energy | `{ threshold, alertsEnabled, scope: "application", unit: "kWh", period }` |
| emissions | `{ threshold, alertsEnabled, scope: "application", unit: "kgCO2e", period }` |
| coverage | `{ thresholdPercent, alertsEnabled, period }` |
| analysis | `{ granularity: "hour" / "day", period }` |

Limites são finitos e não negativos; cobertura aceita 0 a 100. O formato legado continua aceito: limites com `referencePeriod: "month"`, cobertura sem período e análise com `periodDays: 7 / 30`. Campos antigos e novos não se misturam. Preferências antigas usam o mês corrente nos avisos e seu período original na análise; não há migration de conteúdo JSONB.

## Avaliação real e prévia

`GET /me/preferences/alerts` exige JWT, lê apenas as próprias preferências e retorna `{ configured, evaluatedAt, applications }`. Cada aplicação contém `applicationId`, `name` e `evaluations`, com métrica, status, valor, unidade, limite, cobertura, período e limites temporais.

`POST /me/preferences/alerts/preview` é público e somente de leitura: recebe `{ energy, emissions, coverage }`, cada item nulo ou no formato validado da preferência, e avalia o rascunho sobre dados ambientais públicos. Não lê preferências de terceiros, não salva, não envia e-mail e não altera cálculos. As duas rotas usam o mesmo avaliador no backend. A UI reutiliza o mesmo painel na prévia, catálogo, Dashboard e detalhe; a prévia de série usa o mesmo componente do Dashboard com dados reais.

Energia e CO₂e são avaliados por aplicação em seus próprios períodos, independentemente dos filtros da análise. O backend converte gCO₂e persistidos para kgCO₂e antes de comparar. Valor estritamente acima do limite gera `exceeded`; igualdade não ultrapassa. Cobertura estritamente abaixo da referência gera aviso. Resultados parciais já acima do limite são suficientes para avisar; abaixo dele são `insufficient-data`. Ausência de valor nunca vira zero. Estados operacionais são independentes.

Períodos iguais são consultados uma única vez por avaliação, com no máximo três períodos distintos. O módulo de agregação somente de leitura é compartilhado sem iniciar outro scheduler. Avisos pedem o resumo sem listas de rastreabilidade, pois só consomem valores e cobertura. A análise pública completa continua disponível. Padrões de período e granularidade preenchem apenas opções ausentes na URL do Dashboard e do detalhe; escolhas explícitas prevalecem.

## Persistência e verificação

A migration existente `UserPreferences1793200000000` mantém JSONB por usuário/aba, revisão e instante. Escrita, revisão e auditoria ocorrem na mesma transação; a trava no usuário serializa primeiras gravações concorrentes. Não há limites ativos criados automaticamente. Falhas mantêm rascunho e valor ativo separados. Requisições são canceladas na troca de contexto/usuário e respostas antigas não substituem o rascunho atual.

Use `TEST_DATABASE_URL` somente com PostgreSQL isolado e execute `npm run test:cov -- --runInBand`. As suítes de período, avisos e preferências cobrem validação, unidades, ausência, cobertura parcial, isolamento, autorização, concorrência e prévia sem persistência. `frontend/tests/integration/preference-effects.spec.ts` compara prévia e avisos salvos com backend/PostgreSQL reais, confirma que os cálculos públicos permanecem iguais e que filtros explícitos prevalecem.
