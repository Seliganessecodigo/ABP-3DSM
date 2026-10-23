# Visione e ambito del prodotto

GreenER risponde a tre domande: quali applicazioni sono monitorate, quali evidenze ne supportano il consumo e come interpretare energia ed emissioni stimate. Scoperta, metriche, contesto regionale e storico aiutano analisi e priorità.

## Destinatari

| Pubblico | Esigenza |
| --- | --- |
| Gestione infrastruttura | Identificare applicazioni e cambiamenti dell’ambiente. |
| Analisi operativa e ambientale | Studiare periodi, confrontare risultati compatibili, comprendere lacune. |
| Amministrazione | Modificare parametri e accessi con autorizzazione e tracciabilità. |
| Sviluppo e valutazione | Riprodurre l’ambiente e dimostrare criteri di accettazione. |

Sono esigenze, non la matrice definitiva di permessi, ancora [da definire](./decisions).

## Ambito e disponibilità

Riferimento: codice `develop` del 23/10/2026 (commit `1633ca2`). Gli ambienti possono eseguire revisioni diverse; issue chiusa non prova disponibilità in produzione.

| Capacità | Situazione |
| --- | --- |
| Catalogo, ricerca, filtri, paginazione, navigazione e otto lingue | Implementati nell’interfaccia. |
| Scoperta, ciclo di vita, raccolta periodica, incidenti e persistenza | Implementati nel backend. |
| Stato operativo, metriche di origine, evidenze e metodologia delle raccolte | Disponibili nell’API e nel dettaglio; una pagina dedicata spiega modello, formula, parametri e fattore registrati senza ricalcolo. Errori, assenze e dati obsoleti restano distinti. |
| Analisi ambientale, serie temporali e verifica dei contributi per applicazione | Disponibili nell’API e integrate nel dettaglio. |
| Riepilogo ambientale aggregato | Endpoint disponibile (`GET /analysis/summary`); dashboard aggregata non ancora presente nell’interfaccia. |
| Classifica e confronto tra applicazioni | Ambito pianificato. |
| Tema chiaro/scuro | Disponibile come preferenza dell’interfaccia. |
| Autenticazione, amministrazione, simulazione regionale e anteprima di ricalcolo | Pianificati, con dipendenze nel backlog. |

## Percorsi e valore

1. Trovare un’applicazione e aprire dettaglio per confermare identità, posizione e stato.
2. Analizzare un cambiamento distinguendo ultimo tentativo, ultima osservazione valida e assenza.
3. Nel dettaglio, selezionare periodo e granularità, interpretare serie/copertura e ispezionare i contributi di un bucket senza trasformare lacune in zero.
4. Nell’ambito pianificato, riepilogare le applicazioni, ordinarle per impatto e confrontare risultati compatibili.
5. Nell’amministrazione pianificata, modificare parametri autorizzati senza riscrivere lo storico.

La [guida](../guide/monitoring) descrive l’esistente; gli [epic](../roadmap), il comportamento atteso.

## Limiti e valutazione

Le stime non sono misurazioni elettriche dirette né prova di risparmio causato da un’azione. Efficienza per transazione richiede dati del lavoro prodotto. La serie nel dettaglio confronta una singola applicazione con la finestra immediatamente precedente di pari durata; non offre confronti tra applicazioni o periodi a livello di dashboard. Esportazione CSV e colonne configurabili non entrano nel MVP solo perché presenti in Figma. Mappa facoltativa.

Nelle review verificare ricerca, distinzione zero/assenza e tracciabilità fino a periodo, unità ed evidenze. Registrare difficoltà, feedback e cambiamenti in [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133)/[#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Obiettivi di tempo, soddisfazione e prestazioni richiedono baseline e approvazione.
