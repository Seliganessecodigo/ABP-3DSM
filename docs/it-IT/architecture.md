# Architettura

## Componenti

L'ambiente locale usa Docker Compose per avviare tre servizi: frontend, API e PostgreSQL.

| Area | Responsabilità | Tecnologie |
| --- | --- | --- |
| `frontend/` | Interfaccia, navigazione e presentazione | React 19, TypeScript, Vite, i18next |
| `backend/` | API, casi d'uso e integrazioni esterne | NestJS, TypeScript, TypeORM |
| PostgreSQL | Persistenza delle applicazioni e dei dati di dominio | PostgreSQL 18 |

Il frontend chiama solo l'API GreenER. Solo il backend si collega all'Aggregatore di metriche e al Servizio di intensità di carbonio.

## Organizzazione del codice

- `frontend/src/pages/` mantiene ogni schermata insieme ai suoi hook, alle traduzioni e ai CSS Modules.
- `frontend/src/features/` gestisce contratti di dominio, validazione, accesso HTTP, cache e regole pure.
- `backend/src/modules/` raggruppa endpoint e casi d'uso per dominio.
- `backend/src/integrations/` adatta e valida le risposte delle API ausiliarie.
- `backend/src/database/` contiene entità, migrazioni e repository.

## Dati e affidabilità

Il backend integra le fonti e ne persiste i dati rispettando contratti, schemi e unità documentati. Errori, valori assenti, risposte non valide, dati obsoleti e zeri validi sono stati distinti; l'interfaccia deve conservarne la differenza.

Consulta i [contratti delle API esterne nel repository](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) e la [guida all'organizzazione del frontend](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/frontend/src/README.md) per i dettagli di implementazione.

## Letture correlate

[Metodologia e dati](./product/methodology) · [Riferimento API](./reference/api) · [Operazione e diagnosi](./operations)

## Architettura — c343698

React 19/TypeScript/Vite presenta; NestJS/TypeORM/PostgreSQL 18 integra e persiste. Solo backend chiama fonti ausiliarie. Controller: trasporto; service: casi d’uso; adapter: validazione; repository: persistenza. Guard globali, eccezioni `PublicRoute`. Preferenze per utente; audit in `backend/src/shared/audit/`, transazionale al successo.

Dashboard e consultazioni ambientali pubblici. `/login`: e-mail/password o Google abilitato. Admin configura/conferma TOTP di sei cifre anche dopo Google; Analyst/Visitor non ottengono permessi amministrativi. Sessione frontend in memoria: reload richiede login. Backend verifica JWT, sessione, ruolo/stato attuali; 401 per credenziali assenti/invalide, 403 per ruolo insufficiente. Nuove rotte protette per default.

Admin della stessa organizzazione cambia conti tra `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` e motivo. Blocco/disattivazione revocano tutte le sessioni; riattivazione richiede login nuovo. Protetti proprio conto e ultimo Admin attivo. Conflitto atteso: 409; destinazione già raggiunta: successo idempotente. Audit condiviso: successo nella transazione e dinieghi fuori rollback, attore esplicito e nessun segreto. Non consegna gestione completa dei ruoli o recupero password.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
