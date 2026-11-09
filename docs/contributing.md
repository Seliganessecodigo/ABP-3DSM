# Contribuição

## Fluxo de trabalho

1. Consulte a issue e os critérios de aceite antes de alterar o código.
2. Crie uma branch baseada em `develop` e mantenha a mudança no escopo da tarefa.
3. Abra uma pull request para `develop` com título Conventional Commit e referência às issues relacionadas.
4. Descreva decisões, limitações, verificações executadas e evidência visual para mudanças de interface.

## Verificações

A CI executa lint, testes e build do frontend e backend, além do gate SonarQube Cloud. Corrija os apontamentos novos antes da conclusão da PR. Informe no texto da PR tudo o que não foi executado localmente; não declare verificações sem resultado observado.

## Mudanças de interface

Mantenha cada tela e seus estilos, hooks e traduções próximos. O frontend suporta `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN` e `id-ID`. Textos novos precisam estar completos nos doze idiomas, com inglês como fallback.

## Mudanças de integração ou domínio

Confirme contratos e decisões nas issues e nos documentos técnicos. Não invente endpoints, schemas, unidades, fatores ambientais ou políticas de retry. Mudanças de schema persistente precisam de migration; mudanças de contrato devem atualizar OpenAPI e documentação.

## Documentação do site

O conteúdo publicado é mantido em Markdown em `docs/`. Atualize a página equivalente nos doze locales e valide o site com `npm run docs:build`.

## Git

Branches: `tipo/numero-descricao` quando houver issue, ou `tipo/descricao` sem issue; minúsculas e kebab-case sem acentos. Commits e títulos de PR: `tipo(escopo): descrição`, em português, com verbo e sem ponto final. Inclua `Refs #N`, decisões/limitações e verificações observadas. O padrão completo e os tipos permitidos estão no [AGENTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/AGENTS.md).

[Qualidade e aceite](./product/quality) · [Decisões e dependências](./product/decisions)

## CI

A CI verifica o build da documentação, lint/testes/build do frontend, lint/typecheck/testes com PostgreSQL/cobertura/build/migrations do backend e fluxo integrado real no navegador. `TEST_DATABASE_URL` deve apontar para PostgreSQL isolado; sem ela, suítes Jest de banco são ignoradas e a suíte integrada do navegador falha. O gate SonarQube Cloud continua obrigatório em PRs para `develop`: cobertura nova ≥ 80%, duplicação ≤ 3%, ratings A e hotspots 100% revisados. Teste automatizado não substitui avaliação de usabilidade ou aceite do produto.

```sh
npm ci --prefix docs
npm run docs:build
npm ci --prefix frontend
npm run lint --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm ci --prefix backend
npm run lint --prefix backend
npm run typecheck --prefix backend
npm test --prefix backend -- --runInBand
npm run test:cov --prefix backend -- --runInBand
npm run build --prefix backend
# Isolated PostgreSQL: TEST_DATABASE_URL
npm run test:integration --prefix frontend
```
