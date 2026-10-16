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

Riferimento: codice `develop` del 15/10/2026. Gli ambienti possono eseguire revisioni diverse; issue chiusa non prova disponibilità in produzione.

| Capacità | Situazione |
| --- | --- |
| Catalogo, ricerca/filtro stato, navigazione, otto lingue | Implementati nell’interfaccia. |
| Scoperta, eventi del ciclo di vita, raccolta periodica, persistenza | Implementati nel backend. |
| Stato operativo ed evidenze delle raccolte | Esposti dall’API; presentazione UI completa con task proprie. |
| Dashboard ambientale, energia/CO₂e, serie, classifica e confronto | Ambito pianificato. |
| Temi, autenticazione, amministrazione, simulazione regionale, anteprima di ricalcolo | Pianificati, con dipendenze nel backlog. |

## Percorsi e valore

1. Trovare un’applicazione e aprire dettaglio per confermare identità, posizione e stato.
2. Analizzare un cambiamento distinguendo ultimo tentativo, ultima osservazione valida e assenza.
3. Nell’ambito ambientale pianificato, scegliere periodo, leggere copertura/metodologia e confrontare lo stesso contesto.
4. Nell’amministrazione pianificata, modificare parametri autorizzati senza riscrivere lo storico.

La [guida](../guide/monitoring) descrive l’esistente; gli [epic](../roadmap), il comportamento atteso.

## Limiti e valutazione

Le stime non sono misurazioni elettriche dirette né prova di risparmio causato da un’azione. Efficienza per transazione richiede dati del lavoro prodotto. CSV, colonne configurabili e periodo precedente non entrano nel MVP solo perché presenti in Figma. Mappa facoltativa.

Nelle review verificare ricerca, distinzione zero/assenza e tracciabilità fino a periodo, unità ed evidenze. Registrare difficoltà, feedback e cambiamenti in [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133)/[#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Obiettivi di tempo, soddisfazione e prestazioni richiedono baseline e approvazione.
