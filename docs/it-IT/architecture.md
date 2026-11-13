# Architettura

Questa parte si rivolge a sviluppo e operazioni: ambiente locale, contratti e verifiche. Per usare il prodotto, consultate la guida all’uso.

## Documentazione tecnica {#components}

React 19/TypeScript/Vite presenta; NestJS/TypeORM/PostgreSQL 18 integra e persiste. Solo backend chiama fonti ausiliarie. Controller: trasporto; service: casi d’uso; adapter: validazione; repository: persistenza. Guard globali, eccezioni `PublicRoute`. Preferenze per utente; audit in `backend/src/shared/audit/`, transazionale al successo.

```text
frontend/  React 19 · TypeScript · Vite
backend/   NestJS · TypeScript · TypeORM
PostgreSQL 18
frontend → GreenER API → auxiliary APIs
```

## Accedere {#security}

Dashboard e consultazioni ambientali pubblici. `/login`: e-mail/password o Google abilitato. Admin configura/conferma TOTP di sei cifre anche dopo Google; Analyst/Visitor non ottengono permessi amministrativi. Sessione frontend in memoria: reload richiede login. Backend verifica JWT, sessione, ruolo/stato attuali; 401 per credenziali assenti/invalide, 403 per ruolo insufficiente. Nuove rotte protette per default.

Admin della stessa organizzazione cambia conti tra `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` e motivo. Blocco/disattivazione revocano tutte le sessioni; riattivazione richiede login nuovo. Protetti proprio conto e ultimo Admin attivo. Conflitto atteso: 409; destinazione già raggiunta: successo idempotente. Audit condiviso: successo nella transazione e dinieghi fuori rollback, attore esplicito e nessun segreto. Non consegna gestione completa dei ruoli o recupero password.

## Periodi e storico {#data}

`from` e `to` richiedono RFC 3339 con fuso esplicito. `[from,to)` normalizzato UTC. Serie: `hour`, `day`, `month`, `year`, massimo 10.000 punti; eccesso rifiutato. Valori salvati ripartiti per sovrapposizione. Vince `collectedAt` più recente, poi ID lessicale crescente; nessun ripiego su osservazioni precedenti se la vincente non sostiene la metrica.

Metriche senza timestamp misurazione di origine. Intervallo da ricevimento meno `collection_interval_seconds`. Ora richiesta fattore non prova validità; fonte/validità non pubblicate restano ignote. Energia/fattore/emissioni a otto decimali, copertura a quattro. Nessun arrotondamento intermedio. Coperture separate e snapshot originali conservati.

## Letture correlate {#related}

[Riferimento API](./reference/api) · [Per iniziare](./getting-started)

[ADR](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/adr) · [Design](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/design) · [Specs](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/specs)
