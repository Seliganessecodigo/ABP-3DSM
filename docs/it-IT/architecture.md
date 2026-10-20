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
