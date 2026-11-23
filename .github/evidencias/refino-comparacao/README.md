# Refinamento visual da comparação

A comparação passa a priorizar o contexto e os resultados: seleção compacta, catálogo recolhível, coluna de referência identificada, energia e CO₂e com maior hierarquia e ícones discretos da família já usada na sidebar. O botão de ajuda mantém as explicações; não foi adicionado um card de texto explicativo.

A referência visual é a [exportação versionada do frame 623:1603](../251-253-analise/issue-252/623-1603.png), de 13/11/2026. O conector do Figma atingiu a cota e impediu uma leitura atual. Esta entrega refina a aplicação existente e não declara reprodução pixel a pixel nem alteração do arquivo Figma. A matriz mantém os indicadores e a comparação de duas a cinco aplicações do contrato existente; não adiciona séries temporais sem contrato.

| Estado | Desktop | Mobile |
| --- | --- | --- |
| Antes | [Captura](antes-comparison-desktop.png) | [Captura](antes-comparison-mobile.png) |
| Depois | [Captura](depois-comparison-desktop.png) | [Captura](depois-comparison-mobile.png) |

[Tema escuro com cinco aplicações e textos longos](depois-comparison-1440-dark.png). Shell e navegação compartilhados seguem a aplicação atual; o refinamento é da página de comparação. O fixture da captura final inclui diferenças negativas para exercitar sua apresentação; não representa mudança nas regras de cálculo.

Capturas feitas com dados de teste de `frontend/e2e/comparison.spec.ts`. A suíte verifica seleção, referência, período, busca, ordenação, paginação, parciais, ausência, erro/retry, ajuda, teclado e recolhimento sem perder estado. Também cobre cinco aplicações com nomes longos, 320/834/1440 px, temas claro/escuro e textos em português/alemão. Execute em `frontend/`:

```powershell
$env:PLAYWRIGHT_PORT = '4183'
npx playwright test --project=chromium comparison.spec.ts
npm run test:unit
npm run lint
npm run build
```

O acabamento usa tokens existentes e Font Awesome instalado, sem novas dependências. A linguagem de ícones foi aplicada primeiro à comparação para revisão visual; esta PR não altera os cards das outras páginas.
