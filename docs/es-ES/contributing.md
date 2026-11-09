# Contribuir

Esta parte está destinada a desarrollo y operación. Presenta entorno local, contratos y comprobaciones. Para aprender a utilizar el producto, consulte la guía de uso.

## Criterios de validación {#workflow}

Los cambios de alcance y reglas registran problema, resultado esperado y criterios de aceptación en las historias correspondientes. Las revisiones y evaluaciones de usabilidad registran dificultades, comentarios y mejoras. Aún deben definirse retención, backup y recuperación, metas operativas y cuotas externas.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Comprobaciones {#quality}

CI valida documentación, lint/test/build frontend, lint/typecheck/tests PostgreSQL/cobertura/build/migrations backend y flujo integrado real en navegador. `TEST_DATABASE_URL` requiere PostgreSQL aislado; sin ella, Jest omite suites de banco y el navegador integrado falla. SonarQube obligatorio en PR a `develop`: cobertura nueva ≥ 80%, duplicación ≤ 3%, ratings A y hotspots 100% revisados. No sustituye evaluación de usabilidad ni aceptación.

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

El producto debe permitir localizar una aplicación, distinguir cero de ausencia y rastrear un indicador hasta período, unidad, cobertura y metodología. Las consultas conservan contexto y comunican carga, vacío, fallo y datos antiguos. La evaluación incluye teclado, foco visible, texto además de color, móviles y los 12 idiomas.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Lecturas relacionadas {#related}

[Calidad y aceptación](./product/quality) · [Backlog del producto](./roadmap)
