# CT-023 / CT-024 — energia e emissões

Responsável: @GianlucaAlves. Rodada em 24/11/2026, BRT (UTC−03:00).

Versão de produção exercitada: `f282e3cfa9dd75dee04756215dee8607480a576f`, posterior à base dos roteiros `bbe9fe1`. Esta branch acrescenta somente testes, fonte HTTP local controlada e evidências. Fórmula, coeficientes, resultados oficiais e APIs auxiliares compartilhadas não foram alterados.

## Resultado

**CT-023: APROVADO localmente. CT-024: APROVADO localmente.** Cinco testes de cálculo/HTTP/PostgreSQL aprovados, sem falhas/ignorados; dois testes de UI aprovados nos tamanhos 390×844 e 1440×900, cada um em pt-BR e en-US. Chromium 156.0.8078.4, Playwright 1.64.0, Windows, tema claro, zoom 100%.

Backend: aplicação Nest e PostgreSQL 18 reais, HTTP de origem controlado pela fixture. A UI utiliza **API interceptada no navegador com os JSON capturados da integração real**; as capturas não são evidência autônoma de persistência. Essa garantia está nos testes e em `backend-evidence.json`.

### CT-023

| Cenário | Verificação observada |
| --- | --- |
| S1 | Modelo `simplified-energy`, versão `1`: CPU100%=100 W; memória=0,375 W/GB; disco=0,01 W/GB; rede=0,02 W/GB. Unidades/fórmula permanecem registradas na coleta. |
| S2 | CPU50%, memória2GB, disco10GB, rede1GB → 50,87 W. Em60s: 0,000847833333… kWh; PostgreSQL: 0,00084783. |
| S3 | Mesmas métricas,120s → 0,001695666666… kWh; PostgreSQL: 0,00169567. Evidências e IDs próprios para cada coleta. |
| S4 | Métricas zero persistem energia0; CPU ausente/negativa na resposta HTTP inválida não cria coleta nem energia fictícia. |
| S5 | Consultas de coleta, análise individual, summary e comparação mantêm o resultado original; metodologia apresenta fórmula e dados persistidos, sem recálculo. |

Variações numéricas: energia pequena3,75×10⁻¹⁶ kWh e grande finita375.000.000 kWh calculáveis no modelo fixo; overflow retorna null com `NON_FINITE_RESULT`. Não foi configurado outro modelo.

### CT-024

| Cenário | Verificação observada |
| --- | --- |
| S1 | CPU100%, demais métricas0 e intervalo72.000s geram2kWh pelo modelo fixo. Fator100 →200gCO₂e →0,2kgCO₂e; valores persistidos2,00000000 e200,00000000. |
| S2 | API/metodologia em gCO₂e e comparação em kgCO₂e concordam. UI apresenta `0,2 kgCO₂e` em pt-BR e `0.2 kgCO₂e` em en-US nos dois tamanhos. |
| S3 | Energia0 com fator válido e energia positiva com fator0 produzem emissão0 disponível. |
| S4 | Energia0 sem fator mantém emissão null com `CARBON_FACTOR_UNAVAILABLE`. Fator negativo/unidade incompatível e energia negativa/NaN/Infinity retornam indisponibilidade com diagnóstico no cálculo puro. |
| S5 | Fixture fracionária usa os coeficientes fixos, preserva energia/fator originais na evidência e arredonda apenas as colunas decimais para8casas: energia0,00056344 kWh e emissões0,04796234g. O snapshot preserva intensidade85,123456789 usada no cálculo; coluna de fator registra85,12345679. |

## Staging

Consulta de leitura em `https://app-greener-api-staging-brs-ecxiqsrl.azurewebsites.net`: `/applications` retornou200; `/applications/recommendation-ai/collections/latest` atingiu o timeout de15s do cliente. Evidência em `staging.json`; timeout não é aprovação nem um status HTTP fabricado. Não foi feita escrita, pausa, seed ou alteração na origem compartilhada. SHA do processo de staging não confirmado nesta rodada. Aprovação integral restrita ao ambiente local na versão acima.

## Reprodução

Use PostgreSQL descartável conforme `backend/test/README.md`, com `TEST_DATABASE_URL` configurada. A rodada usou container exclusivo `greener-qa-energy-postgres`, porta55479; a fixture cria/remove um banco com UUID próprio. Em `backend/`:

```sh
npm ci --no-audit --no-fund
npm test -- --runInBand qa-energy-emissions.database.spec.ts --json --outputFile=qa-energy-results.json
npm run lint
npm run typecheck
npm run build
```

Após gerar os JSON reais, em `frontend/`:

```sh
npm ci --no-audit --no-fund
# Configure PLAYWRIGHT_PORT=4211 se a porta padrão estiver ocupada.
npm exec -- playwright test --config=playwright.qa-energy.config.ts
npm run lint
npm run build
```

Na raiz, `node .github/evidencias/qa-energia-emissoes/export.cjs` preserva o relatório reduzido e copia capturas e vídeos. Os [vídeos desta rodada](../README.md#arquivos-arquivados) estão no índice. Os horários precisos estão nos JSON de resultados. `backend/test/qa-energy-staging.cjs` reproduz apenas as leituras de staging.

Lint, typecheck e build do backend e lint/build do frontend passaram. Permanecem avisos preexistentes do ranking no lint e do tamanho do bundle Vite. Cobertura completa e demais navegadores não executados. CI e SonarQube Cloud Quality Gate da PR são obrigatórios antes do merge.

Limpeza: fixture fecha API/fonte e remove o banco temporário no afterAll; container exclusivo encerrado ao terminar a rodada. Casos reutilizáveis permanecem abertos.
