# components

Componentes de interface reutilizáveis entre páginas e funcionalidades, sem concentrar regras de domínio.

`AppShell` compõe a navegação compartilhada. A sidebar permanece expandida ou recolhida no desktop enquanto a aplicação está montada; em telas de até 640 px, a navegação abre como drawer e mantém idioma e destinos disponíveis no próprio painel. Novos destinos só devem ser habilitados quando suas rotas estiverem implementadas.

`ThemeSelector` oferece um único interruptor “Modo escuro”, consumindo
`app/useTheme.ts`. Preserva nomes acessíveis e acesso na navegação recolhida/móvel.
