# Organização do frontend

`App.tsx` compõe o layout compartilhado e a página correspondente à rota.
`app/useRoute.ts` concentra a navegação e a leitura da URL.

- `pages/<tela>/`: componente da página, hooks específicos, parâmetros de URL e `locales/` com os oito idiomas.
- `components/`: interface reutilizada por páginas, como `AppShell` e `LanguageSelector`.
- `features/applications/`: contrato e validação das respostas HTTP, acesso à API, cache e seleção do catálogo.
- `utils/`: funções independentes de React, como formatação de datas.
- `i18n/`: textos compartilhados e tipos de apoio. `i18n.ts` configura os idiomas e registra automaticamente os módulos `pages/*/i18n.ts`.

## Adicionar uma página

1. Crie `pages/<tela>/<Tela>Page.tsx` e mantenha os hooks específicos na mesma pasta.
2. Crie `pages/<tela>/locales/<locale>.json` para cada idioma suportado. O nome da pasta da tela é o namespace usado em `useTranslation('<tela>')`.
3. Importe os oito arquivos em `pages/<tela>/i18n.ts` e exporte o mapa de traduções com `satisfies Record<Locale, typeof ptBR>`, seguindo as páginas existentes. O arquivo `pt-BR.json` define as chaves obrigatórias, verificadas no build; o fallback de idioma continua sendo `en-US`. O registro central descobre automaticamente esse módulo.
4. Registre o caminho e os parâmetros em `app/useRoute.ts` e associe a página em `App.tsx`. O conteúdo da página fica no seu componente; o layout é fornecido por `AppShell`.
5. Reutilize ou adicione operações tipadas no módulo da funcionalidade para acessar o backend. As páginas recebem os dados pelos hooks, sem interpretar respostas HTTP.

O roteamento atual cobre o catálogo e `/services/:id`, incluindo navegação pelo histórico do navegador. Ele usa a History API e não introduz uma dependência de roteamento.
