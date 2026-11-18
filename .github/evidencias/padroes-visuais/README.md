# Padronização visual

Pedido: estender os ícones aprovados na comparação e unificar ordenação e breadcrumbs.

- Antes: cards com tratamentos diferentes, setas diferentes entre tabelas e ausência de indicador no Dashboard; trilhas com separadores, hierarquias e nomes acessíveis diferentes.
- Depois: `CardIcon` reutiliza Font Awesome e os tokens existentes; `SortButton` mostra ↕/↑/↓; `Breadcrumbs` apresenta Dashboard, ancestrais e página atual, com nomes traduzidos nos doze idiomas.
- Telas: Dashboard/ranking, aplicações, comparação, detalhe/histórico, metodologia registrada e preferências, simulação regional, prévia de recálculo, configurações/contas/auditoria e acesso.
- A página mantém os handlers, filtros, estado e contratos HTTP. Ícones são decorativos e acompanhados por títulos; a tabela conserva `aria-sort` e controles nativos. Os links de retorno preservam o contexto fornecido pela página; Dashboard recebe somente parâmetros de análise suportados.

Capturas locais com Playwright: Dashboard com indicadores e ordenação; metodologia em desktop e celular, temas claro/escuro; aplicações com indicador neutro e crescente; histórico com a trilha compartilhada. Dashboard e aplicações usam fixtures de teste. A metodologia mostra explicitamente a indisponibilidade das consultas autenticadas, sem transformar ausência em zero.

`frontend/e2e/ui-standards.spec.ts` verifica ordenação por teclado, retorno do detalhe com busca/período, uma trilha por página e ausência de overflow horizontal em 390 e 1440 px. Os testes existentes verificam as demais interações e traduções.
