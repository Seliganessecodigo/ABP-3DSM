# Visione e ambito del prodotto

GreenER risponde a tre domande: quali applicazioni sono monitorate, quali evidenze ne supportano il consumo e come interpretare energia ed emissioni stimate. Scoperta, metriche, contesto regionale e storico aiutano analisi e priorità.

## Destinatari

| Pubblico | Esigenza |
| --- | --- |
| Gestione infrastruttura | Identificare applicazioni e cambiamenti dell’ambiente. |
| Analisi operativa e ambientale | Studiare periodi, confrontare risultati compatibili, comprendere lacune. |
| Sviluppo e valutazione | Riprodurre l’ambiente e dimostrare criteri di accettazione. |

Dashboard e consultazioni ambientali pubblici. `/login`: e-mail/password o Google abilitato. Admin configura/conferma TOTP di sei cifre anche dopo Google; Analyst/Visitor non ottengono permessi amministrativi. Sessione frontend in memoria: reload richiede login. Backend verifica JWT, sessione, ruolo/stato attuali; 401 per credenziali assenti/invalide, 403 per ruolo insufficiente. Nuove rotte protette per default.

## Ambito e disponibilità

Riferimento: `origin/develop`, commit `c343698`, verificato l’08/11/2026. Gli ambienti possono usare revisioni diverse; merge non dimostra pubblicazione.

| Capacità | Situazione |
| --- | --- |
| Catalogo, ricerca, filtri, paginazione, navigazione e dodici lingue | Implementati nell’interfaccia. |
| Scoperta, ciclo di vita, raccolta periodica, incidenti e persistenza | Implementati nel backend. |
| Stato operativo, metriche di origine, evidenze e metodologia delle raccolte | Disponibili nell’API e nel dettaglio; una pagina dedicata spiega modello, formula, parametri e fattore registrati senza ricalcolo. Errori, assenze e dati obsoleti restano distinti. |
| Analisi ambientale, serie temporali e verifica dei contributi per applicazione | Disponibili nell’API e integrate nel dettaglio. |
| `/dashboard` · `GET /analysis/summary` | In `/dashboard`, scegliere 24 ore, 7, 30 o 90 giorni, stato e regione. Totali, copertura, conteggi per stato e composizione emissioni a barre/anello. Tabella con ricerca, filtri, ordinamento energia/CO₂e e paginazione; i filtri tabella non ridefiniscono i totali. Aprire un’applicazione per le evidenze. Aggiornamento periodico di `GET /analysis/summary`, senza reload. |
| Tema chiaro/scuro | Disponibile come preferenza dell’interfaccia. |

## Percorsi e valore

1. Trovare un’applicazione e aprire dettaglio per confermare identità, posizione e stato.
2. Analizzare un cambiamento distinguendo ultimo tentativo, ultima osservazione valida e assenza.
3. Nel dettaglio, selezionare periodo e granularità, interpretare serie/copertura e ispezionare i contributi di un bucket senza trasformare lacune in zero.

La [guida](../guide/monitoring) descrive l’esistente; gli [epic](../roadmap), il comportamento atteso.

## Limiti e valutazione

Le stime non sono misurazioni elettriche dirette né prova di risparmio causato da un’azione. Efficienza per transazione richiede dati del lavoro prodotto. La serie nel dettaglio confronta una singola applicazione con la finestra immediatamente precedente di pari durata; non offre confronti tra applicazioni o periodi a livello di dashboard. Mappa facoltativa.

Nelle review verificare ricerca, distinzione zero/assenza e tracciabilità fino a periodo, unità ed evidenze. Registrare difficoltà, feedback e cambiamenti in [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133)/[#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Obiettivi di tempo, soddisfazione e prestazioni richiedono baseline e approvazione.

## Guida all’uso

In `/history`, scegliere l’applicazione; `applicationId`, periodo e granularità conservano contesto URL. Serie persistita con filtri, fuso di visualizzazione, eventi, pagine numerate e ispezione dei bucket. Contributi con paginazione interattiva di 5, 10, 15, 20 o tutti. Bucket sempre UTC; il fuso visivo non raggruppa nuovamente. Il dettaglio sovrappone il periodo precedente equivalente della stessa applicazione.

In `/administration/calculations`, confrontare originale/anteprima per applicazione e date. Data finale inclusiva dell’intero giorno UTC; API `[from,to)`. Anteprima pubblica con modello attuale e fattori attuali delle regioni storiche, senza salvare. Limiti: 30 giorni, 10.000 osservazioni. Campi `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Fattore mancante conserva energia calcolabile e CO₂e indisponibile. Percentuali richiedono unità/coperture uguali e riferimento positivo.

`/methodology` offre energia, emissioni, copertura, analisi con esempi e preferenze personali. Qualsiasi ruolo autenticato salva solo le proprie schede con revisione ottimistica; 409 per conflitto. Soglie visive non modificano configurazione globale, calcoli o notifiche esterne. Periodo/granularità salvati completano solo URL senza scelta. Metodologia storica: `/services/:id/methodology`, con `collectionId` selezionato.

Admin della stessa organizzazione cambia conti tra `ACTIVE`, `BLOCKED`, `DEACTIVATED`, con `expectedStatus` e motivo. Blocco/disattivazione revocano tutte le sessioni; riattivazione richiede login nuovo. Protetti proprio conto e ultimo Admin attivo. Conflitto atteso: 409; destinazione già raggiunta: successo idempotente. Audit condiviso: successo nella transazione e dinieghi fuori rollback, attore esplicito e nessun segreto. Non consegna gestione completa dei ruoli o recupero password.
