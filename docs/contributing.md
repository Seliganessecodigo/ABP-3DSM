# Contribuição

Esta parte da documentação se destina a desenvolvimento e operação. Apresenta ambiente local, contratos e verificações. Para aprender a usar o produto, consulte o guia de uso.

## Critérios de validação {#workflow}

Épicos, histórias e tasks organizam o produto com critérios verificáveis e referências ao código. Issues, pull requests e commits conectam requisitos, implementação e testes; a documentação reúne arquitetura, contratos, operação e evidências em um acervo versionado.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Verificações {#quality}

A CI verifica o build da documentação, lint/testes/build do frontend, lint/typecheck/testes com PostgreSQL/cobertura/build/migrations do backend e fluxo integrado real no navegador. `TEST_DATABASE_URL` deve apontar para PostgreSQL isolado; sem ela, suítes Jest de banco são ignoradas e a suíte integrada do navegador falha. O gate SonarQube Cloud continua obrigatório em PRs para `develop`: cobertura nova ≥ 80%, duplicação ≤ 3%, ratings A e hotspots 100% revisados.

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

A interface conecta indicadores a período, unidade, cobertura e metodologia, preservando filtros e contexto de navegação. Estados de carregamento, vazio, falha e dados desatualizados recebem tratamento explícito. Teclado, foco visível, texto além de cor, dispositivos móveis, temas e 12 idiomas integram a experiência de uso.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Leitura relacionada {#related}

[Qualidade e aceite](./product/quality) · [Backlog do produto](./roadmap)

[Plano e evidências](./plano-de-entregas)
