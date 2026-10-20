# Contribuir

## Flujo de trabajo

1. Lee la issue y los criterios de aceptación antes de modificar el código.
2. Crea una rama basada en `develop` y limita el cambio al alcance de la tarea.
3. Abre una pull request hacia `develop`, con un título Conventional Commit y referencias a las issues relacionadas.
4. Describe decisiones, limitaciones, comprobaciones ejecutadas y evidencia visual para cambios de interfaz.

## Comprobaciones

La CI ejecuta lint, pruebas y builds de frontend y backend, seguidos del quality gate de SonarQube Cloud. Corrige los nuevos hallazgos antes de completar la pull request. Indica las comprobaciones que no ejecutaste localmente; no declares resultados que no hayas observado.

## Cambios de interfaz

Mantén cada pantalla junto con sus estilos, hooks y traducciones. El frontend admite `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP` y `zh-CN`. Los nuevos textos visibles deben estar completos en los ocho idiomas; el inglés es el idioma alternativo.

## Cambios de integración o dominio

Confirma los contratos y las decisiones en las issues y los documentos técnicos. No inventes endpoints, esquemas, unidades, factores ambientales ni políticas de reintento. Los cambios del esquema persistente requieren una migración; los cambios de contrato deben actualizar OpenAPI y la documentación.

## Documentación del sitio

El contenido publicado se mantiene en Markdown en `docs/`. Actualiza la página equivalente en los ocho idiomas y valida el sitio con `npm run docs:build`.

## Git

Branches: `tipo/numero-descripcion` con issue o `tipo/descripcion` sin ella, minúsculas y kebab-case sin acentos. Commits/títulos PR: `tipo(ambito): descripción`, con descripción en portugués, verbo inicial y sin punto final. Incluir `Refs #N`, decisiones/límites y checks observados. Véase [AGENTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/AGENTS.md).

[Calidad y aceptación](./product/quality) · [Decisiones y dependencias](./product/decisions)
