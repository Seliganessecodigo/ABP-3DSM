# Retorno de foco — bug #494

Responsável pelos testes: @GianlucaAlves.

Ambiente local: Windows, Chromium via Playwright 1.64.0, `http://127.0.0.1:4199`, pt-BR, tema claro e zoom 100%. Catálogo e regiões são fixtures interceptadas no navegador; nenhum dado real foi alterado.

## Antes e depois

- Base antes da correção: `f282e3cfa9dd75dee04756215dee8607480a576f`. A reprodução própria falhou em `expect(applicationButton).toBeFocused()` depois de fechar o seletor por Escape. A captura `antes-desktop.png` preserva essa rodada.
- Correção: `e90a15b9d0a0343f7ea2ba6a0be169d70ceee7dc`. O fechamento nativo do diálogo passou a ocorrer no cleanup de layout, antes de React remover seu DOM. Assim, o navegador consegue restaurar o foco ao acionador. O mesmo ajuste foi aplicado ao seletor e à confirmação de limpeza.
- Regressão de foco aprovada em **1440×900** e **390×844 CSS px**: Escape e botão Fechar, seleção de aplicação/região, cancelamento da região, cancelamento/Escape da confirmação e confirmação da limpeza sem diálogo remanescente. `depois-1440.png` e `depois-390.png` mostram o foco após Escape.

## Verificações

```powershell
npm ci --offline --no-audit --no-fund
$env:PLAYWRIGHT_PORT = '4199'
npm exec -- playwright test --project=chromium regional-simulation-focus.spec.ts --workers=1
npm exec -- playwright test --project=chromium regional-simulation.spec.ts regional-simulation-focus.spec.ts --workers=1
npm run lint
npm run build
```

A primeira rodada ampliada teve 8 testes aprovados e duas falhas em testes existentes que procuram `h1` após `goto(..., { waitUntil: 'commit' })`, antes de qualquer diálogo. A repetição somente desses dois testes passou (2/2), sem mudança adicional de produção. Os dois testes de foco passaram nas rodadas após a correção. O lint e o build passaram, com três avisos já existentes em `RankingPage.tsx` e o aviso já existente de tamanho de chunk.

Backend, Firefox e Safari não exercitados. Não houve deploy; CI e SonarQube Cloud da PR precisam estar aprovados antes do merge. A issue #494 permanece aberta até o fluxo de revisão/merge.
