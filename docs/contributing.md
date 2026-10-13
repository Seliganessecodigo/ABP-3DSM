# Contribuição

## Fluxo de trabalho

1. Consulte a issue e os critérios de aceite antes de alterar o código.
2. Crie uma branch baseada em `develop` e mantenha a mudança no escopo da tarefa.
3. Abra uma pull request para `develop` com título Conventional Commit e referência às issues relacionadas.
4. Descreva decisões, limitações, verificações executadas e evidência visual para mudanças de interface.

## Verificações

A CI executa lint, testes e build do frontend e backend, além do gate SonarQube Cloud. Corrija os apontamentos novos antes da conclusão da PR. Informe no texto da PR tudo o que não foi executado localmente; não declare verificações sem resultado observado.

## Mudanças de interface

Mantenha cada tela e seus estilos, hooks e traduções próximos. O frontend suporta `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP` e `zh-CN`. Textos novos precisam estar completos nos oito idiomas, com inglês como fallback.

## Mudanças de integração ou domínio

Confirme contratos e decisões nas issues e nos documentos técnicos. Não invente endpoints, schemas, unidades, fatores ambientais ou políticas de retry. Mudanças de schema persistente precisam de migration; mudanças de contrato devem atualizar OpenAPI e documentação.

## Documentação do site

O conteúdo publicado é mantido em Markdown em `docs/`. Atualize a página equivalente nos oito locales e valide o site com `npm run docs:build`.
