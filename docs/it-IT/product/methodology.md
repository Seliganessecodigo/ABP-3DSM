# Metodologia e dati

Un modello semplificato stima energia da CPU, memoria, disco e rete nell’intervallo osservato. La potenza stimata diventa energia secondo la durata. Le emissioni moltiplicano energia per intensità di carbonio regionale. I coefficienti appartengono al modello accademico, non sono misurazioni elettriche dirette o fattori regionali ufficiali. I risultati conservano metodo e fattore originali.

## Interpretare i dati {#vocabulary}

| Concetto | Significato |
| --- | --- |
| Applicazione | Servizio con identità stabile nel catalogo. |
| Osservazione | Insieme di metriche associato a un intervallo. |
| Energia | Quantità stimata nel periodo, in kWh. |
| Intensità di carbonio | Fattore regionale in gCO₂e/kWh. |
| Emissioni | Quantità equivalente di CO₂ con unità indicata. |
| Copertura | Parte del periodo sostenuta da evidenza valida. |

## Modello di stima {#model}

| Parametro | Valore |
| --- | --- |
| CPU (100%) | 100 W |
| Memoria | 0.375 W/GB |
| Disco | 0.01 W/GB |
| Rete | 0.02 W/GB |

```text
P [W] = P_CPU + P_RAM + P_disk + P_network
E [kWh] = P [W] × Δt [h] / 1000
CO₂e [g] = E [kWh] × I [gCO₂e/kWh]
```

## Comprendere la copertura {#coverage}

La copertura è la proporzione del periodo con osservazioni valide. Energia ed emissioni hanno coperture separate: può esserci energia stimata senza fattore per calcolare emissioni. Confrontate periodi, unità e coperture compatibili. Copertura bassa indica analisi parziale, non una riduzione dimostrata dei consumi.

Zero significa che un’osservazione valida sostiene quel valore. Una lacuna indica dati utilizzabili mancanti, non consumo nullo. Dopo un errore può restare l’ultima lettura valida con il suo orario originale. Verificate aggiornamento e copertura prima di decidere. Le schermate richiedono informazioni 60 secondi dopo ogni tentativo; non garantisce una nuova misura a ogni aggiornamento.

## Periodi e storico {#history}

| Regola | Significato |
| --- | --- |
| Storico conservato | Preferenze e anteprime non sostituiscono originali. |
| Assenza esplicita | Errori, metriche mancanti e dati precedenti restano distinti da zero. |
| Consultazione pubblica | Leggere indicatori è pubblico; salvare preferenze e amministrare account richiede autorizzazione. |

Nell’anteprima di ricalcolo scegliete applicazione e date per confrontare l’originale con modello attuale e fattori attuali delle regioni osservate. L’ultimo giorno è incluso interamente in UTC. Limiti: 30 giorni e 10.000 osservazioni. L’anteprima non viene salvata e non cambia lo storico. Le differenze percentuali richiedono unità/coperture uguali e originale positivo.

## Letture correlate {#related}

[Guida all’uso](../guide/monitoring) · [Riferimento API](../reference/api)
