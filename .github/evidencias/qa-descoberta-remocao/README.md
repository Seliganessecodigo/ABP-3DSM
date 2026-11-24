# CT-014 e CT-015 — descoberta e remoção

Responsável: @GianlucaAlves. Código exercitado: `f282e3cfa9dd75dee04756215dee8607480a576f`, 103 commits após a base `bbe9fe1`. Nenhum código de produção foi alterado.

As três suítes de backend executadas em 23/11/2026 passaram: **22 testes, zero falhas**. Nest, PostgreSQL 18 e adapters HTTP reais receberam respostas de fontes locais controladas. A extensão `sources.responses` da fixture permite escolher respostas por caminho, sem alterar a API auxiliar compartilhada nem o comportamento padrão do harness. Lint, typecheck e build do backend passaram.

- `observado.json`: respostas HTTP, coletas, eventos e incidentes da rodada.
- `testes.json`: títulos, resultados e duração dos 22 testes.
- `browser-observado.json`: navegador, respostas reais e descoberta sem reload em cada viewport concluído em 24/11/2026.
- `ct014-*.png` e `ct014-jornada-*.webm`: capturas e vídeos dos fluxos efetivamente concluídos.
- `staging.json`: consulta pública adicional do catálogo; nenhum dado ou serviço auxiliar foi alterado em staging.

## Resultado por cenário

CT-014: S1 descobriu o ID não UUID `qa-nova-nao-uuid`, com cidade nula; S2 manteve uma identidade e um evento de entrada; S3 mudou somente o nome sem inferir nova região; S4 mudou a região para br-norte, preservando coletas e snapshots anteriores de br-sudeste. As consultas de catálogo, detalhe e evidência antiga passaram. O complemento visual de S5 consulta a API real da fixture, avança apenas o relógio de polling do navegador e confirma a chegada da nova aplicação sem navegação/reload; somente viewports registrados em `browser-observado.json` contam como executados.

CT-015: S1 manteve serviço omitido cuja consulta individual retornava 200 e continuou coletando; S2 removeu somente após ausência+404 e registrou `service-detail-404`; S3 preservou ID, removedAt, coletas, metodologia e evidências; S4 repetiu ciclos sem duplicar remoção ou gerar zeros e retornou medidas null na janela posterior; S5 confirmou cada ausente na lista vazia, sem consultar individualmente o serviço presente. Variações 500, timeout real de 30 segundos e payload inválido não removeram e mantiveram coleta com incidente. Cancelamento após a primeira confirmação não persistiu remoções parciais.

## Reprodução

PostgreSQL descartável exclusivo, porta 55469, conforme `backend/test/README.md`. Em `backend/`, definir `TEST_DATABASE_URL` para esse banco e executar:

```sh
npm ci --no-audit --no-fund
npm test -- --runInBand qa-discovery-removal.database.spec.ts removal-confirmation.spec.ts discovery-batch.database.spec.ts
npm run lint
npm run typecheck
npm run build
```

O complemento visual usa `backend/test/qa-discovery.server.ts` (API 4317 e controle local 4318), Vite em 4320 com `vite.qa.config.mjs` desta pasta e `node .github/evidencias/qa-descoberta-remocao/browser.cjs`. Sem interceptação da API no navegador. Idioma pt-BR, claro, zoom100%, America/Sao_Paulo, Chromium 156.0.8078.4.

Fixtures criam e removem somente bancos `quality_129_<uuid>` descartáveis. Sem alteração de histórico compartilhado. Os controles locais não fazem parte da API do produto. Não foram executados testes completos de cobertura ou outros navegadores; CI e SonarQube Cloud são obrigatórios antes de merge.
