# Guida all’uso

Partite dal riepilogo ambientale, individuate un’applicazione da approfondire e apritene il dettaglio. Usate storico e metodologia per capire periodo e stime. Considerate sempre la copertura prima di confrontare risultati.

## Trovare un’applicazione {#catalog}

Nel catalogo cercate per nome, identificatore o regione e filtrate per stato. Scorrete le pagine e aprite un’applicazione. Senza corrispondenze, rivedete i filtri. L’indirizzo conserva ricerca e pagina per condividere o riprendere la consultazione.

## Leggere la dashboard {#dashboard}

Nella dashboard scegliete 24 ore, 7, 30 o 90 giorni, regione e stato. Consultate energia, emissioni, copertura e conteggi per stato. Il grafico mostra quote di emissioni a barre o anello. Ricerca, filtri e ordinamento per impatto modificano le righe della tabella; i totali mantengono il perimetro selezionato.

Nella serie temporale, alterna tra energia e CO₂e o consulta la tabella degli intervalli. La finestra di 24 ore usa un raggruppamento orario; le altre, giornaliero. Gli intervalli seguono UTC e gli stessi filtri degli indicatori. Le lacune restano senza valore.

## Esaminare il dettaglio {#detail}

Aprite il dettaglio per identità, posizione, stato e orari di aggiornamento. Esaminate metriche e risultati ambientali nello stesso periodo. La metodologia registrata mostra modello, parametri e fattore di carbonio usati senza cambiare il risultato. Se manca la città, le altre informazioni geografiche restano utili.

Il fattore equivalente riassume i fattori regionali applicati, ponderati per l’energia con emissioni calcolate. La spiegazione usa questa energia, che può essere inferiore al totale quando mancano fattori in parte del periodo. Apri i dettagli per consultare valori e fonti per regione.

## Esplorare lo storico {#history}

Nello storico scegliete applicazione, periodo e raggruppamento per ora, giorno, mese o anno. Filtri e paginazione individuano intervalli; la composizione mostra osservazioni incluse ed esclusioni. Il fuso cambia la visualizzazione delle date, ma il raggruppamento resta UTC. La sovrapposizione del dettaglio confronta la stessa applicazione con il periodo precedente di pari durata.

## Confrontare con un’anteprima di ricalcolo {#preview}

Nell’anteprima di ricalcolo scegliete applicazione e date per confrontare l’originale con modello attuale e fattori attuali delle regioni osservate. L’ultimo giorno è incluso interamente in UTC. Limiti: 30 giorni e 10.000 osservazioni. L’anteprima non viene salvata e non cambia lo storico. Le differenze percentuali richiedono unità/coperture uguali e originale positivo.

## Personalizzare l’analisi {#preferences}

In Metodologia esplorate energia, emissioni, copertura e analisi. Le dimostrazioni usano esempi segnalati sullo schermo. Accedete per salvare soglie di presentazione e opzioni iniziali di periodo e raggruppamento. Ogni persona cambia solo le proprie preferenze; calcoli e configurazione globale restano invariati. In caso di conflitto ricaricate la preferenza prima di riprovare. Le opzioni già presenti nell’indirizzo dell’analisi hanno priorità.

## Accedere {#access}

Catalogo, dashboard e consultazioni ambientali sono pubblici. Per salvare preferenze usate e-mail/password o Google se abilitato e con account collegato tramite invito. Gli amministratori confermano anche un codice di sei cifre dell’autenticatore. Ricaricare termina la sessione dell’interfaccia e richiede nuovo accesso. I permessi amministrativi dipendono dal ruolo.

## Lingua e aspetto {#appearance}

Il selettore offre 12 lingue; la scelta resta nel browser. Il modo scuro cambia l’aspetto, che segue il sistema prima di una scelta esplicita. Con archiviazione bloccata le preferenze possono perdersi al reload. La lingua formatta date e numeri senza cambiare gli istanti osservati.

## Interpretare i dati {#data}

Zero significa che un’osservazione valida sostiene quel valore. Una lacuna indica dati utilizzabili mancanti, non consumo nullo. Dopo un errore può restare l’ultima lettura valida con il suo orario originale. Verificate aggiornamento e copertura prima di decidere. Le schermate richiedono informazioni 60 secondi dopo ogni tentativo; non garantisce una nuova misura a ogni aggiornamento.

| Stato | Significato |
| --- | --- |
| Disponibile | L’applicazione ha restituito metriche utilizzabili. |
| Non disponibile | Il tentativo attuale è fallito; può esistere storico valido. |
| Senza metriche | L’applicazione è nota, ma il tentativo non ha metriche utilizzabili. |
| Rimossa | L’assenza è confermata nel catalogo di origine; identità e storico restano. |

La copertura è la proporzione del periodo con osservazioni valide. Energia ed emissioni hanno coperture separate: può esserci energia stimata senza fattore per calcolare emissioni. Confrontate periodi, unità e coperture compatibili. Copertura bassa indica analisi parziale, non una riduzione dimostrata dei consumi.

## Diagnosi {#support}

Segnalate applicazione, periodo, filtri, ora con fuso e azione eseguita. Descrivete esito atteso e osservato. Le catture aiutano se prive di credenziali e dati privati.

## Letture correlate {#related}

[Metodologia e dati](../product/methodology) · [Riferimento API](../reference/api)
