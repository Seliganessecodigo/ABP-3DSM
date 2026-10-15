# Usare il catalogo e analizzare un’applicazione

Guida a catalogo e dettaglio operativo esistenti. Dashboard ambientale, analisi e amministrazione rimangono pianificate negli [epic](../roadmap).

## Trovare un’applicazione

1. Aprire il frontend; in locale seguire [Per iniziare](../getting-started).
2. Cercare nome, ID, codice regionale o regione e combinare filtro stato.
3. Usare paginazione. Eliminare filtri prima di interpretare nessuna corrispondenza come catalogo vuoto.
4. Confermare ID e posizione nel dettaglio. Città nulla valida; posizione storica incompleta sconosciuta.

URL con `q`, `state`, `page` conserva il contesto. I filtri attuali si applicano nel frontend alla lista dell’API.

## Aggiornamento

Catalogo/dettaglio interrogano all’apertura e pianificano la successiva richiesta 60 secondi dopo la fine di ogni tentativo. Polling UI, raccolta backend e intervallo aggregatore sono indipendenti; aggiornare lo schermo non garantisce nuove osservazioni.

La UI indica orari di tentativo e risposta valida. Un errore dopo successo conserva dati precedenti, senza farli passare per nuova osservazione. Aggiornamento manuale del catalogo senza reload; uscendo si annullano richieste pendenti.

## Interpretare situazioni

| Situazione | Significato / azione |
| --- | --- |
| Catalogo vuoto | API senza applicazioni; verificare scoperta iniziale. |
| Nessuna corrispondenza | Modificare filtri; possono esistere altre applicazioni. |
| Errore iniziale | Nessun dato valido; riprovare e verificare operazione. |
| Errore dopo successo | Conservare lettura precedente e controllarne l’ora. |
| Applicazione non trovata | Verificare ID/link; diversa da applicazione conosciuta rimossa. |
| Applicazione rimossa | Identità/storico conservati; assenza confermata da snapshot valido. |

## Stato, lingua e assistenza

`AVAILABLE`, `UNAVAILABLE`, `NO_METRICS`, `REMOVED` sono stati operativi. Freschezza, motivo e calcolabilità sono distinti. Applicazione disponibile può non avere fattore carbonio; indisponibile può avere storico valido. Evidenze già nell’API; blocco completo metriche/freschezza con task UI proprie. Leggere [Metodologia](../product/methodology).

Otto lingue, preferenza nel browser. Cambiare lingua non cambia identità o istanti.

Segnalare ambiente, ID, filtri, data/ora con fuso, azione, atteso/osservato. Screenshot senza credenziali/dati privati; vedere [Operazione](../operations).
