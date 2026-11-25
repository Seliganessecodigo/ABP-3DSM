# CT-052, CT-053 e CT-055 — comparação e simulação regional

Responsável: @GianlucaAlves.

## Rodada original — 23/11/2026, 00:50 BRT

Frontend/backend de referência: `f282e3cfa9dd75dee04756215dee8607480a576f`, 103 commits após a base dos roteiros `bbe9fe1`. Frontend em `http://127.0.0.1:4197`, Chromium via Playwright 1.64.0, Windows, pt-BR, America/Sao_Paulo, tema claro e zoom 100%. Desktop 1440×900 e mobile emulado 390×844, com toque no mobile.

O frontend usou **API interceptada no navegador** para cenários determinísticos. Os testes HTTP separados usaram Nest e PostgreSQL 18 reais, em banco descartável `127.0.0.1:55459`, com fator de carbono controlado. Essas evidências não se confundem: fixtures de UI não demonstram persistência/autorização do backend.

| Caso | Resultado original | Evidência |
| --- | --- | --- |
| CT-052 / #424 | APROVADO | `ct052-*.png`, [vídeos arquivados](../README.md#arquivos-arquivados), `browser.json` e testes HTTP |
| CT-053 / #425 | APROVADO | `ct053-*.png`, [vídeos arquivados](../README.md#arquivos-arquivados), `browser.json` e testes HTTP |
| CT-055 / #427 | REPROVADO — foco após Escape | `ct055-bug494-*`, `browser.json` e [bug #494](https://github.com/Seliganessecodigo/ABP-3DSM/issues/494) |

### CT-052

- S1: nenhuma consulta com zero/uma aplicação; consulta automática ao selecionar a segunda.
- S2: fixture A=2 kWh/B=3 kWh; B−A=+1 kWh/+50%, exibidos nos dois tamanhos.
- S3: seleção até cinco e alteração de período para 30 dias preservam janela comum; sexta aplicação desabilitada. Os testes HTTP conferem resultados persistidos e localização histórica.
- S4: paginação de 21 candidatas, busca, ordenação e remoção da referência preservam seleções; referência passa para a próxima aplicação válida.
- S5: reload e voltar/avançar restauram IDs, referência e período; sem overflow horizontal da página.

### CT-053

- S1: URL deduplica IDs; referência fora da seleção permanece corrigível. API staging rejeitou zero/um/seis IDs, duplicados e referência ausente/externa.
- S2: estados complete, partial e empty exercitados; ausência não virou zero.
- S3: ZERO_REFERENCE, VALUE_UNAVAILABLE e INCOMPATIBLE_UNIT apresentados; cobertura diferente preserva diferenças numéricas aplicáveis, com −50 pontos percentuais na fixture.
- S4: requisição A+B atrasada não substitui A+C/período mais recente; erro do novo período remove o resultado anterior.
- S5: 503 seguido de retry preserva seleção e recupera resultados. Backend confirma leituras originais.

### CT-055

- S1: período 90d e IDs desconhecidos impedem envio; diálogo busca/ordena a lista inteira e distingue ausência de correspondência.
- S2: destino sem fator preserva 10 kWh e referência; vazio não vira zero; referência zero não produz percentual inválido.
- S3: resultado anterior fica identificado como pendente ao alterar período; voltar/avançar preservam contexto.
- S4: cancelamento de consulta pendente, 503 e retry executados sem submissão automática/duplicada.
- S5: cancelar limpeza preserva resultado; confirmar remove parâmetros/resultado e retorna a 7d.
- Variação reprovada: fechar seletor com Escape deixa `document.activeElement` em BODY, em vez do acionador Aplicação. Reproduzido nos dois tamanhos e isolado em teste próprio; **não é uma aprovação funcional**, mesmo quando o runner classifica essa falha conhecida como esperada.
- Backend: consulta regional preservou o resultado oficial antes/depois; 31 dias e 10.001 observações foram rejeitados sem consultar fator. Oito testes de domínio complementaram energia/fator indisponível, zero e cobertura.

`browser.json` conserva seis fluxos principais aprovados e duas reproduções da falha de foco (expectedStatus=failed e observedStatus=failed). A indicação de oito resultados esperados do runner não transforma o CT-055 em aprovado. `qa-api-results.json` registra 12 testes HTTP/PostgreSQL aprovados; 27 testes fora do filtro não fazem parte desta rodada. `qa-regional-domain-results.json` registra oito testes de domínio aprovados.

## Staging

API: `https://app-greener-api-staging-brs-ecxiqsrl.azurewebsites.net`. As respostas de validação disponíveis estão em `staging.json`. As consultas comparativas válidas excederam o timeout de 30 segundos do cliente, tanto na tentativa com janela de 24 horas quanto na tentativa com um minuto. Isso não é um status HTTP 503 nem uma aprovação de consulta; não foi definido SLA. A execução local com fixtures cobre os cenários determinísticos.

Não foi possível obter a URL do frontend pelo acesso Azure disponível: consultas não retornaram Static Web Apps e uma assinatura exigiu renovação da sessão. Nenhuma credencial ou estado Azure foi alterado. Não houve pausa de staging, mudança de origem auxiliar ou carga de 10.001 observações no ambiente compartilhado. Não se presume SHA implantado a partir apenas do código local.

## Reprodução

Na pasta `frontend/`, instalar dependências com `npm ci` e executar:

```powershell
$env:PLAYWRIGHT_PORT = '4197'
$env:QA_EXPECT_FOCUS_BUG = 'true' # somente para reproduzir a rodada anterior à correção
npm exec -- playwright test --config=playwright.qa.config.ts
```

O harness `.qa.ts` é executado pela configuração explícita, sem adicionar uma falha conhecida ao fluxo padrão de regressão. Para retestar uma revisão corrigida em outro checkout, usar `QA_SOURCE_DIR` apontando ao seu `frontend/`, `QA_EXPECT_FOCUS_BUG=false`, `QA_OUTPUT_DIR` e `QA_REPORT` distintos. O Vite usa o código da revisão indicada; o runner mantém as mesmas fixtures e assertivas.

Os testes HTTP usam `TEST_DATABASE_URL` exclusivo, conforme `backend/test/README.md`, e os arquivos `environmental-analysis-comparison.database.spec.ts` e `environmental-analysis.database.spec.ts`, selecionando somente comparação e simulação regional. Não executar testes de prévia de recálculo retirados do escopo. O arquivo JSON lista os nomes efetivamente aprovados para reproduzir o filtro.

Frontend: lint e build aprovados, com os três avisos preexistentes de Ranking e o aviso de tamanho do bundle. O harness também passou em verificação TypeScript separada. Testes novos não alteram código de produção nem metodologia. Fixtures de banco foram removidas pelos testes; o container exclusivo `greener-qa-comparison-postgres` foi encerrado em 24/11/2026. CI e SonarQube Cloud da PR devem ser conferidos antes de merge.

## Reteste CT-055 — 24/11/2026, 09:59 BRT — APROVADO

Correção na [PR #497](https://github.com/Seliganessecodigo/ABP-3DSM/pull/497), revisão `34091cea77663141cbd843d82812dd5014198de1` (fonte corrigida em `e90a15b9d0a0343f7ea2ba6a0be169d70ceee7dc`). Frontend corrigido servido em `http://127.0.0.1:4207`, com o mesmo harness e fixtures da rodada anterior. `resultado.json` registra o comando do servidor e confirma o uso da worktree da correção, sem presumir revisão de staging.

- **6/6 testes aprovados**, sem falhas esperadas, ignorados ou respostas obsoletas aceitas: fluxo S1–S5, variações e reprodução específica de foco em cada viewport.
- Escape agora devolve foco a `BUTTON` com rótulo `Aplicação`, em 1440×900 e 390×844.
- Trocar US-VA para US-CA durante solicitação pendente cancela o escopo anterior; somente a simulação explícita posterior apresenta o fator US-CA.
- Falha de catálogo preserva seleção de região disponível; retry do catálogo recupera aplicação. Lista de regiões vazia mantém o envio bloqueado e não aparece como erro de integração. Falha/retry da lista de regiões também foi exercitada no fluxo principal.
- S1–S5 novamente aprovados: URL inválida, fator ausente, sem energia, referência zero, pendência, voltar/avançar, cancelamento, 503/retry e cancelamento/confirmação da limpeza.

Resultados e capturas ficam em `reteste-494/`. Os [vídeos do reteste](../README.md#arquivos-arquivados) estão no índice. A rodada original reprovada foi preservada. A aprovação corresponde à revisão corrigida local; não se afirma implantação do fix em staging ou merge da PR.
