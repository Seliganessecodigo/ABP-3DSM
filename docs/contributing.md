# Contribuição

Esta parte da documentação se destina a desenvolvimento e operação. Apresenta ambiente local, contratos e verificações. Para aprender a usar o produto, consulte o guia de uso.

## Critérios de validação {#workflow}

Mudanças de escopo e regras de uso devem registrar o problema, o resultado esperado e os critérios de aceite nas histórias correspondentes. Revisões do produto e avaliações de usabilidade registram dificuldades observadas, feedback e melhorias. Retenção de dados, backup e recuperação, metas operacionais e cotas das fontes externas ainda exigem definição.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Verificações {#quality}

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
npm run test:integration --prefix frontend
```

## Documentação técnica {#documentation}

O produto deve permitir localizar uma aplicação, distinguir zero de ausência e rastrear um indicador até seu período, unidade, cobertura e metodologia. As consultas precisam preservar o contexto de navegação e comunicar carregamento, vazio, falha e dados antigos. A avaliação inclui teclado, foco visível, leitura por texto além de cor, dispositivos móveis e os 12 idiomas.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Leitura relacionada {#related}

[Qualidade e aceite](./product/quality) · [Backlog do produto](./roadmap)
