# Qualità e accettazione

L’interfaccia collega gli indicatori a periodo, unità, copertura e metodologia, conservando filtri e contesto di navigazione. Caricamento, vuoto, errore e dati obsoleti sono gestiti esplicitamente. Tastiera, focus visibile, testo oltre al colore, dispositivi mobili, temi e 12 lingue fanno parte dell’esperienza.

## Criteri di accettazione {#acceptance}

| Regola | Significato |
| --- | --- |
| Storico conservato | Preferenze e anteprime non sostituiscono originali. |
| Assenza esplicita | Errori, metriche mancanti e dati precedenti restano distinti da zero. |
| Consultazione pubblica | Leggere indicatori è pubblico; salvare preferenze e amministrare account richiede autorizzazione. |

## Interpretare i dati {#integrity}

Zero significa che un’osservazione valida sostiene quel valore. Una lacuna indica dati utilizzabili mancanti, non consumo nullo. Dopo un errore può restare l’ultima lettura valida con il suo orario originale. Verificate aggiornamento e copertura prima di decidere. Le schermate richiedono informazioni 60 secondi dopo ogni tentativo; non garantisce una nuova misura a ogni aggiornamento.

La copertura è la proporzione del periodo con osservazioni valide. Energia ed emissioni hanno coperture separate: può esserci energia stimata senza fattore per calcolare emissioni. Confrontate periodi, unità e coperture compatibili. Copertura bassa indica analisi parziale, non una riduzione dimostrata dei consumi.

## Criteri di validazione {#assessment}

Epic, storie e attività organizzano il prodotto con criteri verificabili e riferimenti al codice. Issue, pull request e commit collegano requisiti, implementazione e test; la documentazione raccoglie architettura, contratti, operazioni ed evidenze in un insieme versionato.

## Verifiche {#engineering}

Per la base documentata, la CI ha approvato 542 test frontend, 705 backend e tre flussi integrati, oltre a lint, controllo dei tipi, build, migrazioni e gate SonarQube Cloud. Il sito offre 12 lingue con verifica automatica dell’equivalenza di contenuti, contratti e collegamenti.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

[Contribuire](../contributing)

## Letture correlate {#related}

[Principi di ingegneria](../product/decisions) · [Contribuire](../contributing)
