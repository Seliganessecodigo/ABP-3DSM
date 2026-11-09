# Organização do frontend

`pages/methodology/` contém as quatro abas em `MethodologyPage`, rascunhos em `usePreferenceDraft` e componentes locais de explicação/prévia. `RecordedMethodology` preserva a consulta histórica por coleta. `features/preferences/` valida o contrato HTTP autenticado; `pages/detail/useAnalysisDefaults` aplica somente padrões ausentes na URL.

`pages/recalculationPreview/` apresenta a prévia de recálculo em administração, com escopo local à tela e sem persistir a resposta. `features/analysis/recalculationPreview.ts` valida a resposta do endpoint de prévia; o resultado permanece separado da análise histórica.

Playwright aceita `PLAYWRIGHT_PORT` para usar outra porta quando a padrão 4173 estiver ocupada, inclusive em worktrees simultâneos. Metodologia carrega Inter local de `assets/fonts/`, com licença SIL OFL, para reproduzir as referências sem CDN em runtime.

`App.tsx` é o ponto de composição: liga rota, layout e página, sem conter fluxo ou estado de uma tela.
`app/` contém a navegação e inicialização global. Providers globais ficam nessa camada quando mais de uma rota depende deles.

- `pages/<tela>/`: componente da página, estilos em CSS Modules, hooks específicos, parâmetros de URL e `locales/` com os doze idiomas. `pages/dashboard/` compõe os resumos ambientais e filtros de `features/analysis/`; `pages/history/` seleciona a aplicação e reutiliza a análise de `pages/detail/`.
- `components/`: interface compartilhada por telas ou infraestrutura visual, como `AppShell`, `LanguageSelector`, `LoadingState`, ações e feedback de requisição. `LoadingState` apresenta aviso e placeholders no carregamento inicial; na atualização, use a versão compacta e preserve os dados anteriores. Ações pendentes usam `aria-disabled` com bloqueio do handler para manter o foco. Elementos específicos continuam junto da página que os usa.
- `features/<domínio>/`: contratos e validação HTTP, acesso à API, cache e regras puras pertencentes ao domínio; não contém composição visual de página. `features/analysis/` integra resumo, série e consulta paginada de contribuições por bucket. Consulte o README do módulo para o contrato corrente e seus limites.
- `features/applications/useApplicationCatalog.ts` concentra o recurso de catálogo usado por catálogo, histórico e dashboard: snapshot validado, polling após a resposta, cancelamento e preservação dos últimos dados válidos. O resumo do dashboard tem ciclo independente; mudanças de período, estado ou região consultam somente o resumo. A ação de atualização solicita ambos os recursos, respeitando uma consulta de catálogo já pendente.
- `utils/`: funções independentes de React, como formatação de datas.
- `styles/shared.css`: estilos visuais usados por várias páginas, como botões, cabeçalhos e mensagens. `index.css` contém reset, base e tokens globais; cada componente compartilhado importa seu próprio CSS.
- Campos de texto, datas, números e selects usam `form-control`, com fonte herdada, borda, seta de seleção, foco, erro e estado desabilitado compartilhados. A densidade padrão tem 44 px; `form-control--compact` tem 36 px em paginação no desktop e 44 px em telas pequenas/toque; `form-control--large` tem 50 px nos formulários de login e preferências. CSS da página mantém largura e composição; não redefine a aparência básica desses campos. Campos numéricos de destaque e buscas com ícone mantêm suas composições específicas.
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
3. Crie `locales/<locale>.json` para `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN` e `id-ID`. O nome da pasta da tela é o namespace de `useTranslation('<tela>')`; inglês (`en-US`) é o fallback.
4. Importe os doze arquivos em `i18n.ts` e exporte o mapa com `satisfies Record<Locale, typeof ptBR>`. O tipo exige as mesmas chaves em todos os idiomas; use interpolação para valores variáveis e `Intl` para datas/números. O registro central descobre automaticamente cada módulo.
5. Registre caminho e parâmetros em `app/useRoute.ts`, associe a página em `App.tsx` e preserve navegação do browser.
6. Se a tela precisa de dados, use hooks para coordenar carregamento e uma feature tipada para API/cache/validação; confira o contrato do backend. Cubra carregamento, sucesso, vazio, erro e atualização conforme aplicável.

O roteamento atual cobre o catálogo, `/services/:id`, `/dashboard`, `/history`, `/methodology`, `/administration/calculations`, `/login` e o retorno SSO em `/sso/callback`, incluindo navegação pelo histórico do navegador. Ele usa a History API e não introduz uma dependência de roteamento.

`app/analysisNavigation.ts` mantém o período ao abrir dashboard/histórico pela sidebar e leva a aplicação do detalhe para o histórico. Somente os parâmetros suportados pelo destino são propagados: filtros locais da tabela não se tornam filtros da análise. O fluxo completo contra backend e PostgreSQL reais é executado por `npm run test:integration`; preparação e isolamento estão em `backend/test/README.md`.

A integridade dos catálogos de idioma é verificada em `tests/unit/locales.spec.ts`, incluindo todas as páginas registradas, interpolações e caracteres corrompidos. `e2e/translations.spec.ts` percorre as rotas, as quatro abas de preferências, os filtros do histórico e os fluxos de autenticação nos doze idiomas; também verifica a tradução de mensagens já abertas ao trocar o idioma.
