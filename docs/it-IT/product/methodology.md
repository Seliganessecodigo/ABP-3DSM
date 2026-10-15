# Metodologia e significato dei dati

Assenza, errore e dati obsoleti non equivalgono a zero. Le regole ambientali sono requisiti; modello energetico completo e coefficienti richiedono approvazione.

## Lessico e unità

| Concetto | Significato |
| --- | --- |
| Applicazione | Identità stabile; nome/posizione modificabili. |
| Osservazione/raccolta | Metriche persistite per applicazione e intervallo. |
| Ciclo | Scoperta, riconciliazione, raccolta; non singola misurazione. |
| Energia | Quantità accumulata in kWh, distinta dalla potenza. |
| Intensità carbonio | Fattore regionale della fonte in gCO₂e/kWh. |
| CO₂e | Emissioni equivalenti con unità/fattore identificati. |
| Copertura | Parte del periodo sostenuta da evidenze valide; politica pendente. |
| Stale | Osservazione valida precedente conservata, non successo attuale. |

Aggregatore: CPU in %, memoria, disco e rete in GB. Non sono kWh; conversione richiede modello, coefficienti e ipotesi documentati.

## Tempo e provenienza

La fonte non pubblica timestamp di misurazione. GreenER registra ricezione e deriva `[receivedAt - collection_interval_seconds, receivedAt]`; non prova istanti reali di misura della fonte.

Ultimo tentativo, osservazione valida e aggiornamento anagrafico sono diversi. Ora di consultazione del fattore non prova validità ufficiale. Snapshot conserva valore, identità interna, contratto e consultazione; bibliografia/validità non pubblicate restano sconosciute.

## Energia ed emissioni

Relazione dimensionale pianificata:

    CO₂e [g] = energia [kWh] × intensità [gCO₂e/kWh]

Solo esempio didattico: 2 kWh × 100 gCO₂e/kWh = 200 gCO₂e = 0,2 kgCO₂e. Né fattori approvati né letture del prodotto. Non definisce come ricavare energia da CPU/memoria/disco/rete.

Senza fattore, energia valida rimane valida ma CO₂e può essere non calcolabile. Zero richiede evidenza valida.

## Storico e scenari

| Risultato | Regola |
| --- | --- |
| Originale | Conservare osservazioni, configurazione, metodologia e fattore. |
| Anteprima ricalcolo | Configurazione corrente identificata, senza salvare/sostituire; permessi, limiti e fattore pendenti. |
| Simulazione regionale | Energia costante, altro fattore, separata dai risultati ufficiali. |

Totali, classifiche e confronto richiedono periodi/coperture compatibili. Niente zeri artificiali nelle lacune o percentuali senza denominatore valido. Arrotondamento, bordi e granularità sono [decisioni pendenti](./decisions).
