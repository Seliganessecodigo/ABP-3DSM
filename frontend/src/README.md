# Organização do frontend

`App.tsx` é o ponto de composição: liga rota, layout e página, sem conter fluxo ou estado de uma tela.
`app/` contém a navegação e inicialização global. Providers globais ficam nessa camada quando mais de uma rota depende deles.

- `pages/<tela>/`: componente da página, estilos em CSS Modules, hooks específicos, parâmetros de URL e `locales/` com os oito idiomas.
- `components/`: interface compartilhada por telas ou infraestrutura visual, como `AppShell`, `LanguageSelector`, ações e feedback de requisição. Elementos específicos continuam junto da página que os usa.
- `features/<domínio>/`: contratos e validação HTTP, acesso à API, cache e regras puras pertencentes ao domínio; não contém composição visual de página. `features/analysis/` contém a fronteira tipada de apresentação ambiental já entregue; sua integração HTTP aguarda contratos aprovados. Consulte o README do módulo para esse limite e o estado do aceite.
- `utils/`: funções independentes de React, como formatação de datas.
- `styles/shared.css`: estilos visuais usados por várias páginas, como botões, cabeçalhos e mensagens. `index.css` contém reset, base e tokens globais; cada componente compartilhado importa seu próprio CSS.
- `i18n/`: textos compartilhados e tipos de apoio. `i18n.ts` configura os idiomas e registra automaticamente os módulos `pages/*/i18n.ts`.

## Limites de propriedade

- Cada tela é dona do seu fluxo, estado, textos e estilos. Não adicione conteúdo de tela ao `App.tsx`, ao CSS global ou ao namespace de tradução compartilhado.
- CSS da tela usa `<Tela>Page.module.css`; seletores de elementos ficam sob uma classe local. CSS compartilhado deve atender a mais de uma tela ou componente.
- Mantenha estado local à tela por padrão. Coloque na URL o estado que precisa sobreviver a reload, navegação ou compartilhamento. Estado global exige consumidores em mais de uma rota.
- A página chama hooks de tela; hooks coordenam ciclo de vida e chamam features. A feature valida a resposta e expõe dados tipados. Componentes de interface não fazem parsing de resposta HTTP.
- Extraia um componente/serviço compartilhado quando houver uma segunda necessidade concreta ou responsabilidade de domínio compartilhada; evite criar camadas “para o futuro”.

## Adicionar uma página

1. Crie `pages/<tela>/<Tela>Page.tsx`; mantenha hooks, componentes e tipos específicos no mesmo diretório. Deixe em `App.tsx` somente a associação entre rota e página.
2. Crie `<Tela>Page.module.css` e importe como `styles`; mantenha seletores dentro de classes locais. Reuse `shared.css` e componentes existentes para os padrões realmente comuns.
3. Crie `locales/<locale>.json` para `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP` e `zh-CN`. O nome da pasta da tela é o namespace de `useTranslation('<tela>')`; inglês (`en-US`) é o fallback.
4. Importe os oito arquivos em `i18n.ts` e exporte o mapa com `satisfies Record<Locale, typeof ptBR>`. O tipo exige as mesmas chaves em todos os idiomas; use interpolação para valores variáveis e `Intl` para datas/números. O registro central descobre automaticamente cada módulo.
5. Registre caminho e parâmetros em `app/useRoute.ts`, associe a página em `App.tsx` e preserve navegação do browser.
6. Se a tela precisa de dados, use hooks para coordenar carregamento e uma feature tipada para API/cache/validação; confira o contrato do backend. Cubra carregamento, sucesso, vazio, erro e atualização conforme aplicável.

O roteamento atual cobre o catálogo e `/services/:id`, incluindo navegação pelo histórico do navegador. Ele usa a History API e não introduz uma dependência de roteamento.
