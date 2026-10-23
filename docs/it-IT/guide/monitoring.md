# Usare il catalogo e analizzare un’applicazione

Guida al catalogo, al dettaglio operativo e all’analisi ambientale per applicazione disponibile nell’interfaccia. Il riepilogo aggregato esiste nell’API; dashboard, classifica, confronto e amministrazione restano pianificati negli [epic](../roadmap).

## Trovare un’applicazione

1. Aprire il frontend; in locale seguire [Per iniziare](../getting-started).
2. Cercare nome, ID, codice regionale o regione e combinare filtro stato.
3. Usare paginazione. Eliminare filtri prima di interpretare nessuna corrispondenza come catalogo vuoto.
4. Confermare ID e posizione nel dettaglio. Città nulla valida; posizione storica incompleta sconosciuta.

URL con `q`, `state`, `page` conserva il contesto. I filtri attuali si applicano nel frontend alla lista dell’API.

## Aggiornamento

Catalogo/dettaglio interrogano all’apertura e pianificano la successiva richiesta 60 secondi dopo la fine di ogni tentativo. Polling UI, raccolta backend e intervallo aggregatore sono indipendenti; aggiornare lo schermo non garantisce nuove osservazioni.

La UI indica orari di tentativo e risposta valida. Un errore dopo successo conserva dati precedenti, senza farli passare per nuova osservazione. Aggiornamento manuale del catalogo senza reload; uscendo si annullano richieste pendenti.

## Analizzare i risultati ambientali

Nel dettaglio dell’applicazione, scegli una finestra mobile di 24 ore, 7, 30 o 90 giorni e una granularità oraria, giornaliera, mensile o annuale. La serie mostra energia e CO₂e dei risultati persistiti. La sovrapposizione confronta la finestra selezionata con quella immediatamente precedente di pari durata. È un confronto temporale per una singola applicazione, non una classifica né un confronto tra applicazioni.

Usa i filtri e l’ordinamento della tabella per trovare i bucket. Ispezionane uno per vedere i contributi inclusi e le esclusioni con le relative motivazioni. La tabella è paginata; l’interfaccia carica al momento solo la prima pagina dei contributi. Lacune ed esclusioni non significano zero. Senza evidenze calcolabili, il risultato resta non disponibile.

## Interpretare situazioni

Per tracciare un indicatore, apri **Visualizza metodologia completa** nel dettaglio dell’applicazione. Puoi anche scegliere **Metodologia** nella navigazione e selezionare un’applicazione. La pagina mostra modello, formula, parametri e presupposti registrati, oltre ai dati del fattore carbonio quando disponibili. Il link dal dettaglio usa la raccolta selezionata; la navigazione usa l’ultima raccolta valida. La pagina spiega le evidenze salvate senza ricalcolare il risultato.

| Situazione | Significato / azione |
| --- | --- |
| Catalogo vuoto | API senza applicazioni; verificare scoperta iniziale. |
| Nessuna corrispondenza | Modificare filtri; possono esistere altre applicazioni. |
| Errore iniziale | Nessun dato valido; riprovare e verificare operazione. |
| Errore dopo successo | Conservare lettura precedente e controllarne l’ora. |
| Applicazione non trovata | Verificare ID/link; diversa da applicazione conosciuta rimossa. |
| Applicazione rimossa | Identità/storico conservati; assenza confermata da snapshot valido. |

## Stato, lingua e assistenza

`AVAILABLE`, `UNAVAILABLE`, `NO_METRICS`, `REMOVED` sono stati operativi. Freschezza, motivo e calcolabilità sono distinti. Un’applicazione disponibile può non avere un fattore carbonio; una non disponibile può avere uno storico valido. Il dettaglio mostra stato, metriche, risultati ambientali, serie storica e contributi consultabili per periodo. Consulta [Riferimento API](../reference/api) e [Metodologia](../product/methodology) per distinguere assenza, errore e zero.

Otto lingue, preferenza nel browser. Cambiare lingua non cambia identità o istanti.

Segnalare ambiente, ID, filtri, data/ora con fuso, azione, atteso/osservato. Screenshot senza credenziali/dati privati; vedere [Operazione](../operations).

## Preferenza del tema

Nelle preferenze di navigazione, usa l’interruttore **Modalità scura**: disattivato applica il tema chiaro; attivato applica quello scuro. Alla prima visita, GreenER segue l’aspetto del sistema e i suoi cambiamenti finché non usi l’interruttore. Da quel momento prevale la scelta esplicita; questa interfaccia non offre un’azione per tornare a seguire il sistema.

La scelta si applica a catalogo, dettagli e layout globale senza modificare filtri o dati. Viene salvata in questo browser con la chiave `greener-theme` per la visita successiva. Se l’archiviazione è bloccata, la scelta funziona durante la sessione ma può perdersi al ricaricamento.
