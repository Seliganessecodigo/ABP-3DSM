# Evidências visuais — #65 detalhe ambiental

## Catálogo (validação independente)

Capturas pós-refactor em Chromium com locale `pt-BR`, fuso `America/Sao_Paulo` e viewport desktop `1366 × 988` / mobile `358 × 844`. A captura mobile usa página inteira; o conteúdo tem cerca de 2246 px de altura com os cinco registros simulados.

- `catalog-desktop-claro.png`
- `catalog-desktop-escuro.png`
- `catalog-mobile-claro.png`
- `catalog-mobile-escuro.png`

O endpoint público `/api/applications` recebeu uma resposta mockada estável com cinco registros representando estados disponíveis, indisponíveis, sem métricas e removidos. Datas foram fixadas em 19/10/2026. Isso valida apresentação, não integrações nem dados operacionais; nenhum fixture foi adicionado ao runtime. A evidência do detalhe será complementada quando sua implementação estiver estável.

### Verificações no browser

- Desktop: shell em `(12,12)`, `1342 × 964`; sidebar expandida com `222 px`, colapsada com `72 px`; topbar horizontal oculta. Tabela e sete cabeçalhos visíveis.
- Mobile: largura de documento igual ao viewport (`358 px`); tabela substituída pelos cards; menu com alvo `44 × 44 px`, controles de idioma e tema visíveis, menu fecha com `Escape`.
- Os temas aplicaram tokens esperados: claro `--background-page #f4faf7` / `--surface-card #ffffff`; escuro `#101b18` / `#182923`. O foco da busca mostra outline de `3 px` com offset `3 px` nos dois temas.
- Espaçamentos autorais revistos nos estilos compartilhados e de catálogo estão em múltiplos de `4 px`; bordas, raios, tipografia, ícones e offsets de foco são exceções visuais.

### Comparação com a referência

O catálogo escuro foi conferido com a proposta Figma #213 disponível localmente em [aplicacoes-escuro-desktop.png](../213-temas/aplicacoes-escuro-desktop.png) e [aplicacoes-escuro-mobile.png](../213-temas/aplicacoes-escuro-mobile.png). Proporções do shell, sidebar, tabela/cards e paleta semântica estão alinhadas. O layout atual conserva ações de atualização e filtros por coluna e apresenta paginação/estado de atualização, além dos elementos do protótipo.

A coluna de estado mantém motivo e última observação em disclosure nativo, fechado por padrão, com indicação de dado stale visível; esse detalhe operacional não aparece no screenshot do Figma. Os registros de captura são demonstração visual. A validação não cobre detalhe ambiental, precisão de dados da API, navegação completa nem textos dos outros sete idiomas.
