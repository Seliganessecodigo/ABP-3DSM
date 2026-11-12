# Contribuire

Questa parte si rivolge a sviluppo e operazioni: ambiente locale, contratti e verifiche. Per usare il prodotto, consultate la guida all’uso.

## Criteri di validazione {#workflow}

Modifiche a perimetro e regole registrano problema, risultato atteso e criteri di accettazione nelle storie pertinenti. Review e valutazioni di usabilità raccolgono difficoltà, feedback e migliorie. Retention, backup/ripristino, obiettivi operativi e quote esterne richiedono ancora decisioni.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Verifiche {#quality}

CI verifica documentazione, lint/test/build frontend, lint/typecheck/test PostgreSQL/copertura/build/migration backend e flusso browser integrato reale. `TEST_DATABASE_URL` deve usare PostgreSQL isolato; senza variabile Jest salta suite database e browser integrato fallisce. SonarQube obbligatorio verso `develop`: copertura nuova ≥ 80%, duplicazione ≤ 3%, rating A e hotspot tutti revisionati. Non sostituisce usabilità/accettazione.

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

## Documentazione tecnica {#documentation}

Il prodotto deve permettere di trovare un’applicazione, distinguere zero da assenza e risalire da un indicatore a periodo, unità, copertura e metodo. Le consultazioni conservano contesto e comunicano caricamento, vuoto, errore e dati precedenti. Si valutano tastiera, focus visibile, testo oltre al colore, dispositivi mobili e 12 lingue.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Letture correlate {#related}

[Qualità e accettazione](./product/quality) · [Backlog del prodotto](./roadmap)
