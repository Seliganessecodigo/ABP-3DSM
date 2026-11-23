# Guida all’uso

Partite dal riepilogo ambientale, individuate un’applicazione da approfondire e apritene il dettaglio. Usate storico e metodologia per capire periodo e stime. Considerate sempre la copertura prima di confrontare risultati.

## Trovare un’applicazione {#catalog}

Nel catalogo cercate per nome, identificatore o regione e filtrate per stato. Scorrete le pagine e aprite un’applicazione. Senza corrispondenze, rivedete i filtri. L’indirizzo conserva ricerca e pagina per condividere o riprendere la consultazione.

## Leggere la dashboard {#dashboard}

Nel dashboard, scegli periodo, regione e stato per consultare energia, CO₂e, successo delle raccolte e applicazioni per stato. Il successo è la quota di tentativi registrati con metriche valide e salvate; senza registrazioni il tasso non è disponibile. È mostrata la prima registrazione del periodo. La copertura temporale resta nelle analisi e nella tabella, con avvisi sui dati parziali. Grafici, ricerca, filtri e paginazione conservano il contesto.

Nella serie temporale, alterna tra energia e CO₂e o consulta la tabella degli intervalli. La finestra di 24 ore usa un raggruppamento orario; le altre, giornaliero. Gli intervalli seguono UTC e gli stessi filtri degli indicatori. Le lacune restano senza valore.

## Esaminare il dettaglio {#detail}

Aprite il dettaglio per identità, posizione, stato e orari di aggiornamento. Esaminate metriche e risultati ambientali nello stesso periodo. La metodologia registrata mostra modello, parametri e fattore di carbonio usati senza cambiare il risultato. Se manca la città, le altre informazioni geografiche restano utili.

Il fattore equivalente riassume i fattori regionali applicati, ponderati per l’energia con emissioni calcolate. La spiegazione usa questa energia, che può essere inferiore al totale quando mancano fattori in parte del periodo. Consulta la metodologia per verificare valori e fonti per regione. La scheda del fattore mantiene la stessa altezza degli altri indicatori, senza espansione interna.

## Esplorare lo storico {#history}

Nello storico scegliete applicazione, periodo e raggruppamento per ora, giorno, mese o anno. Filtri e paginazione individuano intervalli; la composizione mostra osservazioni incluse ed esclusioni. Il fuso cambia la visualizzazione delle date, ma il raggruppamento resta UTC. La sovrapposizione del dettaglio confronta la stessa applicazione con il periodo precedente di pari durata.

## Anteprima del calcolo {#preview}

Il confronto tra applicazioni richiede periodi, unità e coperture compatibili. La simulazione regionale mantiene energia osservata, cambia il fattore dello scenario e separa i risultati dagli indicatori ufficiali.

## Personalizzare l’analisi {#preferences}

In Metodologia esplora energia, emissioni, copertura e impostazioni iniziali. Le anteprime consultano dati reali e segnalano assenze o errori; non modificano cronologia né formula. Accedi per salvare soglie personali e opzioni. Date, filtri e raggruppamenti espliciti nell’indirizzo prevalgono sui valori salvati.

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

## Altre analisi e impostazioni {#other}

La classifica ordina i risultati per energia o CO₂e nel periodo. Il confronto riunisce applicazioni e un riferimento; la simulazione regionale mantiene l’energia e mostra uno scenario separato. Gli utenti autorizzati accedono a monitoraggio, account e audit delle modifiche in Impostazioni. L’account personale consente di cambiare password; il login offre recupero tramite token temporaneo.

## Letture correlate {#related}

[Metodologia e dati](../product/methodology) · [Riferimento API](../reference/api)
