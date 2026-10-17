# GreenER frontend

## Catálogo de aplicações

A interface implementa o catálogo e a rota de detalhe `/services/:id`, consumindo
`GET /applications` e `GET /applications/:id`. Busca, filtro por estado e
paginação de 10 itens são aplicados no cliente, sem acrescentar parâmetros ao
contrato da API. `VITE_API_URL` define a origem da API; no desenvolvimento local,
sem essa variável, Vite encaminha `/api` para `http://localhost:3000`.

O catálogo identifica separadamente carregamento, resultado vazio, falha e
busca sem resultados. Erros de consulta preservam o último catálogo válido e
permitem tentar novamente. O detalhe pode ser aberto diretamente, distingue
404 de falhas de integração e permite voltar mantendo busca, estado, página e
demais parâmetros da URL.

## Internacionalização

A interface usa `i18next` e `react-i18next` nos locales `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP` e `zh-CN`. A preferência é guardada em `localStorage` na chave `greener:locale`; sem uma preferência válida, usamos primeiro um locale do navegador compatível e depois `pt-BR`. Inglês (`en-US`) é o fallback para chaves ausentes.

As páginas ficam em `src/pages/<tela>/`, junto dos hooks e de `locales/<locale>.json`. O módulo `i18n.ts` de cada tela importa os oito idiomas; `src/i18n.ts` descobre esses módulos automaticamente e usa o nome da pasta da tela como namespace. Os textos compartilhados ficam em `src/i18n/locales/`, no namespace `common`.

Para adicionar texto, inclua a chave no `pt-BR.json` da tela e traduza-a nos outros sete arquivos. O mapa exportado pela tela usa `satisfies Record<Locale, typeof ptBR>` para exigir as chaves obrigatórias em todos os idiomas durante o build. Use `useTranslation('<tela>')` para textos específicos e `useTranslation('common')` para textos compartilhados. Passe valores dinâmicos por interpolação e formate datas e números com `Intl` e `i18n.resolvedLanguage`.

Consulte [a organização do código](src/README.md) para adicionar uma página, registrar sua rota e integrar dados do backend.

## Testes

Os fluxos públicos do catálogo e detalhe são testados em Chromium com Playwright.
As regras de busca, filtro e paginação também têm testes isolados. As respostas
HTTP são controladas pelos testes e seguem o DTO do catálogo do backend.

Execute dentro desta pasta:

```sh
npm ci
npx playwright install chromium
npm test
```

Use `npm run test:e2e` para executar apenas Chromium ou `npm run test:unit` para
executar apenas as regras isoladas. O Playwright inicia o Vite em
`127.0.0.1:4173`; essa porta precisa estar livre.

Decisões cobertas por testes: a UI mostra 10 itens por página; páginas acima do
resultado são ajustadas para a última página válida; resultado vazio tem zero
páginas e página corrente 1; a busca ignora maiúsculas/minúsculas e mantém a
ordem recebida. Atualização manual evita definir política de polling. O
parâmetro `period` preservado na navegação não é enviado à API.

Os testes de URL direta e recarga usam o Vite. A suíte não cobre integração ao
vivo com o backend, leitores de tela reais, polling, cálculo ambiental ou
configuração de deep links no hosting. A CI executa lint, testes e build do
frontend; o gate SonarQube Cloud continua obrigatório na PR para `develop`.

## Temas (US-17 / #214)

As preferências da sidebar oferecem Claro/Escuro e a ação Usar tema do sistema.
A preferência local (`greener-theme`: `light`, `dark`, `system`) é distinta da
aparência efetiva. Ausência ou valor inválido segue o sistema; escolhas antigas
claro/escuro continuam válidas. Armazenamento indisponível não impede alternar
na sessão, mas não garante persistência após recarga.

O script clássico bloqueante em `public/theme-init.js`, referenciado no início
do documento, aplica a escolha antes da primeira pintura. `app/useTheme.ts`
coordena a preferência e mudanças do sistema; `components/ThemeSelector` apresenta
os controles. Os tokens ficam em `styles/theme.css`, no elemento raiz, e os
estilos das páginas consomem esses tokens. Não há chamada de API para temas.

A referência é a tabela semântica inferior do PNG “Design System · Cores e
Componentes”, fornecido para #213/#214. Ajustes para contraste no tema claro:
texto de sucesso `#00875D` → `#006B49`, atenção `#9F6506` → `#895700`, erro
`#DC4C45` → `#B83233` e neutro `#607087` → `#56657B`. Borda de controle clara
`#788C82` é separada da borda decorativa `#DCE8E3`. No escuro, a borda segue
`#607F70`. Valide as combinações usadas com texto ≥ 4,5:1 e controles/foco ≥ 3:1.
Gráficos futuros devem consumir cores semânticas e identificação textual; o PNG
não fornece paleta de séries e não há gráfico executável nesta entrega.

`npm run test:e2e -- theme.spec.ts` executa a suíte de temas no Chromium.
Ela usa a interface pública e os mocks HTTP existentes. A revisão visual complementa
os testes automatizados; não equivale à homologação do PO.
