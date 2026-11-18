# components

`CardIcon` apresenta ícones decorativos Font Awesome em uma base discreta, com cores do tema e tamanhos `medium` e `small`. Use em títulos de cards e seções quando ajudar a identificar o assunto; preserve o título em texto. `inline` acrescenta o espaçamento antes do texto.

`SortButton` compartilha o botão e as setas de ordenação: `none` (↕), `ascending` (↑) e `descending` (↓). A tabela mantém o estado, o handler e `aria-sort` no cabeçalho; `tableSortPresentation` converte o estado existente. O indicador é decorativo e o botão conserva a interação nativa por teclado.

`Breadcrumbs` recebe `items` com rótulos traduzidos e links dos ancestrais, além de `navigate`. Acrescenta Dashboard, preservando o contexto de análise suportado pela navegação existente, e identifica o último item com `aria-current="page"`. A página fornece os links de retorno com seus filtros e, quando necessário, `onNavigate` para fechar uma inspeção. O componente preserva cliques modificados para abrir outra aba.

Componentes de interface reutilizáveis entre páginas e funcionalidades, sem concentrar regras de domínio.

`AppShell` compõe a navegação compartilhada. A sidebar permanece expandida ou recolhida no desktop enquanto a aplicação está montada; em telas de até 640 px, a navegação abre como drawer e mantém idioma e destinos disponíveis no próprio painel. Novos destinos só devem ser habilitados quando suas rotas estiverem implementadas.

`ThemeSelector` oferece um único interruptor “Modo escuro”, consumindo
`app/useTheme.ts`. Preserva nomes acessíveis e acesso na navegação recolhida/móvel.

`ActionButton` padroniza ações primárias e secundárias, mantendo botões para ações e âncoras para navegação. `RequestFeedback` fornece os invólucros de carregamento, vazio e erro; a página conserva o texto, o nível do título e as ações.

```tsx
<RequestFeedback state="error">
  <h2>{t('errorTitle')}</h2>
  <p>{t('errorHint')}</p>
  <ActionButton onClick={retry} disabled={refreshing}>{t('retry')}</ActionButton>
</RequestFeedback>
```
