# Contribuire

## Flusso di lavoro

1. Leggi l'issue e i criteri di accettazione prima di modificare il codice.
2. Crea un branch basato su `develop` e mantieni la modifica nell'ambito dell'attività.
3. Apri una pull request verso `develop`, con titolo Conventional Commit e riferimenti alle issue pertinenti.
4. Descrivi decisioni, limiti, verifiche effettivamente eseguite e prove visive per le modifiche all'interfaccia.

## Verifiche

La CI esegue lint, test e build di frontend e backend, poi il quality gate SonarQube Cloud. Correggi i nuovi rilievi prima di completare la pull request. Indica le verifiche non eseguite in locale; non dichiarare risultati non osservati.

## Modifiche all'interfaccia

Mantieni ogni schermata insieme ai suoi stili, hook e traduzioni. Il frontend supporta `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP` e `zh-CN`. I nuovi testi visibili devono essere completi in tutte le otto lingue; l'inglese è la lingua di fallback.

## Modifiche a integrazioni o dominio

Verifica contratti e decisioni nelle issue e nei documenti tecnici. Non inventare endpoint, schemi, unità, fattori ambientali o politiche di retry. Le modifiche allo schema persistente richiedono una migrazione; i cambiamenti ai contratti devono aggiornare OpenAPI e la documentazione.

## Documentazione del sito

I contenuti pubblicati sono mantenuti in Markdown in `docs/`. Aggiorna la pagina equivalente in tutte e otto le lingue e verifica il sito con `npm run docs:build`.

## Git

Branch: `tipo/numero-descrizione` con issue, `tipo/descrizione` altrimenti; minuscolo e kebab-case senza accenti. Commit/titoli PR: `tipo(ambito): descrizione`, descrizione in portoghese con verbo e senza punto finale. Includere `Refs #N`, decisioni/limiti, verifiche osservate. Vedere [AGENTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/AGENTS.md).

[Qualità e accettazione](./product/quality) · [Decisioni e dipendenze](./product/decisions)
