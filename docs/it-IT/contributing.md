# Contribuire

Questa parte si rivolge a sviluppo e operazioni: ambiente locale, contratti e verifiche. Per usare il prodotto, consultate la guida all’uso.

## Criteri di validazione {#workflow}

Epic, storie e attività organizzano il prodotto con criteri verificabili e riferimenti al codice. Issue, pull request e commit collegano requisiti, implementazione e test; la documentazione raccoglie architettura, contratti, operazioni ed evidenze in un insieme versionato.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Verifiche {#quality}

CI verifica documentazione, lint/test/build frontend, lint/typecheck/test PostgreSQL/copertura/build/migration backend e flusso browser integrato reale. `TEST_DATABASE_URL` deve usare PostgreSQL isolato; senza variabile Jest salta suite database e browser integrato fallisce. SonarQube obbligatorio verso `develop`: copertura nuova ≥ 80%, duplicazione ≤ 3%, rating A e hotspot tutti revisionati.

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

L’interfaccia collega gli indicatori a periodo, unità, copertura e metodologia, conservando filtri e contesto di navigazione. Caricamento, vuoto, errore e dati obsoleti sono gestiti esplicitamente. Tastiera, focus visibile, testo oltre al colore, dispositivi mobili, temi e 12 lingue fanno parte dell’esperienza.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Letture correlate {#related}

[Qualità e accettazione](./product/quality) · [Backlog del prodotto](./roadmap)

[Piano e prove](./plano-de-entregas)
