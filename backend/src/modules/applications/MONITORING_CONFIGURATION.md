# Controle versionado do monitoramento — #95

Escopo aprovado pelo solicitante: **versionar pausa/retomada, preservando os controles aprovados**. Intervalo, concorrência, coeficientes e metodologia permanecem nas configurações existentes; não há parâmetros arbitrários editáveis. Esta decisão substitui o aceite genérico de parâmetros editáveis da #95 para esta entrega.

## Contrato e autorização

`PATCH /monitoring/control` continua recebendo `{ paused: boolean, reason: string }`, protegido por JWT e papel ADMIN. Motivo não vazio de até 512 caracteres é obrigatório. Não muda o contrato de entrada do frontend entregue na #466.

A resposta acrescenta `configurationVersion` (UUID) a `paused`, `changed` e `updatedAt`. Repetir o estado atual retorna `changed: false`, com a mesma revisão e data, sem novo evento de sucesso. Pedidos concorrentes são serializados pelo bloqueio da linha global do monitoramento.

`GET /monitoring/health` informa a versão atual em `configurationVersion`; quando a configuração está indisponível, o valor é `null`. O ciclo mais recente e os itens de `GET /monitoring/cycles` informam sua própria versão. Leituras continuam restritas a ADMIN. Ciclos anteriores à implantação e descoberta inicial têm versão `null`; não se atribui uma configuração retroativamente.

Os DTOs Swagger documentam esses campos em `/openapi.json`. A versão identifica o controle do scheduler, não uma configuração de cálculo nem uma nova versão metodológica.

## Persistência e aplicação

`monitoring_control_versions` mantém snapshots imutáveis de pausa, revisão anterior, autor (usuário/sistema), motivo e instante de confirmação. O autor é preservado como identidade histórica mesmo se a conta for desativada ou removida. O banco recusa UPDATE/DELETE das revisões. A revisão anterior é uma referência com exclusão restrita e não pode ter dois sucessores.

`monitoring_settings.configurationVersion` referencia a revisão atual. Revisão, estado atual e auditoria de sucesso são gravados na mesma transação. Se qualquer gravação falhar, tudo é revertido e o estado anterior permanece válido. A falha é auditada fora da transação, sem snapshots; se o banco de auditoria estiver indisponível, a operação continua falhando, nunca confirma sucesso parcial.

O runner lê o controle após adquirir o lock de execução e antes de qualquer chamada externa. Essa leitura define o início lógico do ciclo: se pausado, não inicia coleta; se ausente ou falhar, não consulta a origem. O UUID lido é salvo nos detalhes do ciclo e preservado ao concluir, cancelar ou falhar. Alterações posteriores não afetam o ciclo já iniciado. Retomar permite novos ciclos no agendamento existente e não preenche lacunas ou recalcula resultados.

A migration `1793600000000-VersionMonitoringControl` cria uma revisão inicial a partir do estado e data já persistidos, identificando o autor como sistema. Ela não reconstrói operações antigas e não modifica observações, resultados ambientais ou ciclos históricos. Reverter a migration remove o versionamento, mantendo o estado atual de pausa; também remove as revisões, portanto o rollback não preserva a trilha nova de versões.

## Verificação

Testes unitários cobrem validação, versão nos snapshots, repetição, falha e runner pausado/sem configuração. Testes HTTP/PostgreSQL cobrem ADMIN/ANALYST/VISITOR, respostas inválidas, concorrência, imutabilidade, rollback por falha da auditoria e preservação de um ciclo em andamento e suas observações após pausa/retomada.

Executar na pasta `backend/`:

```powershell
npm ci
npm run lint
npm run typecheck
npm run test:cov -- --runInBand
npm run build
```

Os testes de banco exigem `TEST_DATABASE_URL` apontando para PostgreSQL descartável, conforme [fixture de qualidade](../../../test/README.md). A fixture cria um banco próprio e aplica as migrations reais. Sem essa variável, os testes de banco são ignorados; isso não equivale a validá-los.
