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
