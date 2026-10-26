# Metodologia e significato dei dati

Le evidenze conservano il loro significato: assenza, errore e dati obsoleti non equivalgono a zero. L’energia è stimata dal modello semplificato con parametri versionati; non è una misurazione elettrica reale e i parametri non sono un fattore regionale ufficiale. La conversione CO₂e è implementata in #49/#53.

## Lessico e unità

| Concetto | Significato |
| --- | --- |
| Applicazione | Identità stabile; nome/posizione modificabili. |
| Osservazione/raccolta | Metriche persistite per applicazione e intervallo. |
| Ciclo | Scoperta, riconciliazione, raccolta; non singola misurazione. |
| Energia | Quantità accumulata in kWh, distinta dalla potenza. |
| Intensità carbonio | Fattore regionale della fonte in gCO₂e/kWh. |
| CO₂e | Emissioni equivalenti con unità/fattore identificati. |
| Copertura | Parte del periodo richiesta supportata da evidenze valide, calcolata separatamente per energia e CO₂e. |
| Stale | Osservazione valida precedente conservata, non successo attuale. |

Aggregatore: CPU in %, memoria, disco e rete in GB. Non sono kWh; conversione richiede modello, coefficienti e ipotesi documentati.

## Tempo e provenienza

La fonte non pubblica timestamp di misurazione. GreenER registra ricezione e deriva `[receivedAt - collection_interval_seconds, receivedAt]`; non prova istanti reali di misura della fonte.

Ultimo tentativo, osservazione valida e aggiornamento anagrafico sono diversi. Ora di consultazione del fattore non prova validità ufficiale. Snapshot conserva valore, identità interna, contratto e consultazione; bibliografia/validità non pubblicate restano sconosciute.

## Regole temporali ambientali

Le query usano timestamp ISO con fuso esplicito normalizzati in UTC e intervallo [from,to). I bucket UTC per ora/giorno/mese/anno contano solo la sovrapposizione, anche ai bordi parziali. I preset 24h/7d/30d/90d sono finestre mobili esatte con riferimento comune KPI/serie. Limite: 10.000 punti; l’eccesso viene rifiutato senza troncamento né cambio di granularità. La serie ripartisce risultati salvati senza ricalcolare osservazioni; conflitti risolti con collectedAt più recente, poi ID lessicografico crescente, senza fallback se manca la metrica. Nessun arrotondamento aggiuntivo; coperture e snapshot originali restano distinti e conservati.

## Energia ed emissioni

La relazione dimensionale implementata è:

    CO₂e [g] = energia [kWh] × intensità [gCO₂e/kWh]

Solo esempio didattico: 2 kWh × 100 gCO₂e/kWh = 200 gCO₂e = 0,2 kgCO₂e. Né fattori approvati né letture del prodotto. Non definisce come ricavare energia da CPU/memoria/disco/rete.

Senza fattore, energia valida rimane valida ma CO₂e può essere non calcolabile. Zero richiede evidenza valida.

## Storico e scenari

| Risultato | Regola |
| --- | --- |
| Originale | Conservare osservazioni, configurazione, metodologia e fattore. |
| Anteprima ricalcolo | Configurazione corrente identificata, senza salvare/sostituire; permessi, limiti e fattore pendenti. |
| Simulazione regionale | Energia costante, altro fattore, separata dai risultati ufficiali. |

Totali, classifiche e confronti richiedono periodi e coperture compatibili. Le lacune non diventano zero e le percentuali richiedono un denominatore valido. La semantica approvata è descritta sopra. In persistenza, energia, emissioni in grammi e fattore usano otto decimali; la copertura, frazione tra zero e uno, ne usa quattro. Nessun arrotondamento intermedio; gli snapshot JSON mantengono la rappresentazione originale.
