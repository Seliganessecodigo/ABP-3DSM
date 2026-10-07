# Operação dos adapters

`MetricsAggregatorAdapter` valida `/services` como snapshot completo e `/metrics/{id}` como observação independente. Retorna `IntegrationError` com `code` e, quando houver resposta HTTP, `status`. Um 404 de métricas permanece ambíguo e não confirma remoção. `receivedAt` é o horário em que o GreenER recebeu as métricas.

`CarbonIntensityAdapter` valida `/regions/{code}/carbon-intensity`. `CarbonFactorService.capture(code)` consulta o fator e anexa uma versão em `carbon_regions`. A migration `CarbonFactorSnapshots1791340000000` acrescenta `queriedAt`, `contractVersion` e `renewableSharePercent` e permite `source` e `validFrom` nulos para a origem que não publica esses metadados. `version` identifica o snapshot interno; `queriedAt` não é vigência oficial. Linhas históricas que já têm vigência e fonte continuam válidas.

As URLs padrão são as publicadas nos OpenAPI oficiais; `METRICS_AGGREGATOR_URL` e `CARBON_INTENSITY_URL` permitem usar um servidor local. Timeout, retry, autenticação, paginação e limites de concorrência ainda dependem de confirmação operacional. O módulo não chama APIs externas durante sua inicialização. No Compose, depois das migrations, `npm run applications:discover` executa uma sincronização inicial rastreada antes de iniciar o servidor; falha do agregador é registrada no ciclo e não impede a API de iniciar. O comando pode ser executado novamente manualmente; IDs existentes não são duplicados.

Para reproduzir o teste de snapshots com PostgreSQL isolado, crie um banco vazio e execute em `backend/`:

```powershell
$env:TEST_DATABASE_URL='postgresql://usuario:senha@localhost:5432/banco_de_teste'
npm test -- --runInBand carbon-factor.service.spec.ts
```
