# Contribuir

Esta parte está destinada a desarrollo y operación. Presenta entorno local, contratos y comprobaciones. Para aprender a utilizar el producto, consulte la guía de uso.

## Criterios de validación {#workflow}

Épicas, historias y tareas organizan el producto con criterios verificables y referencias al código. Issues, pull requests y commits conectan requisitos, implementación y pruebas; la documentación reúne arquitectura, contratos, operación y evidencias en un conjunto versionado.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Comprobaciones {#quality}

CI valida documentación, lint/test/build frontend, lint/typecheck/tests PostgreSQL/cobertura/build/migrations backend y flujo integrado real en navegador. `TEST_DATABASE_URL` requiere PostgreSQL aislado; sin ella, Jest omite suites de banco y el navegador integrado falla. SonarQube obligatorio en PR a `develop`: cobertura nueva ≥ 80%, duplicación ≤ 3%, ratings A y hotspots 100% revisados.

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

## Documentación técnica {#documentation}

La interfaz vincula los indicadores con su período, unidad, cobertura y metodología, conservando filtros y contexto de navegación. Los estados de carga, vacío, fallo y datos desactualizados tienen tratamiento explícito. Teclado, foco visible, texto además de color, dispositivos móviles, temas y 12 idiomas forman parte de la experiencia.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Lecturas relacionadas {#related}

[Calidad y aceptación](./product/quality) · [Backlog del producto](./roadmap)

[Plan y evidencias](./plano-de-entregas)
