# Decisioni, dipendenze e fonti

Il registro esplicita scelte senza approvare funzioni per omissione. PDF v1.1 è riferimento storico; Markdown evolve tramite PR e resta allineato alle issue.

## Confermate

| ID | Decisione | Conseguenza |
| --- | --- | --- |
| D01 | Ricalcolo come anteprima senza salvare. | Originale preservato, anteprima esclusa da totali/storico. US-12, #263/#264. |
| D02 | Prima assenza da snapshot completo valido conferma rimozione. | Errore fonte/404 metriche non rimuove. US-02, #171. |
| D03 | Ricezione GreenER non è timestamp origine. | Identificare intervalli derivati, non inventare validità. #154/#155. |
| D04 | RNF trasversali, fondamenti/qualità in EP00. | Task finite non esonerano qualità futura. |
| D05 | Simulazione regionale a energia costante. | Scenario non cambia misure/risultati ufficiali. US-15. |

D01 e EP00 confermati il 15/10/2026; altre regole in backlog/contratti versionati.

## Pendenti

| Tema | Da risolvere | Consegne |
| --- | --- | --- |
| Energia | Formula, coefficienti, conversioni, ipotesi. | #49/#53/#58 |
| Tempo/copertura | Bordi, fuso, granularità, arrotondamento, parziali. | #49/#156/#174/#175/#178 |
| Ricalcolo | Permessi, limiti volume/periodo, fattore. | #91/#263/#264 |
| Accessi/conti | Ruoli, bootstrap, sessioni, password/recupero. | #90/#91/#158/#160/#245 |
| Fonti/operazione | Timeout, retry, quote, concorrenza, ritardi. | #155/#243 |
| Continuità | Conservazione, backup/ripristino, disponibilità/prestazioni. | #110/#120/#125/#166 |
| Extra Figma | CSV, colonne, periodo precedente, efficienza per transazione. | #61/#248/#252 |

PO e responsabili tecnici decidono ambito/comportamento; fornitori confermano contratti. Nessuna data o persona assegnata per ipotesi.

## Fonti e modifiche

Markdown: visione/regole. Issue: criteri, task, dipendenze, discussione. Projects: priorità, stato, Sprint, date e PR; non prova implementazione. Figma: intento visivo/handoff, numeri illustrativi non contratto. OpenAPI/codice: revisione esposta. Contratti esterni: schema/unità con versione/data.

Conflitto: esplicitare, decidere col responsabile, sincronizzare fonti. Figma non autorizza endpoint inventati. Issue/PR documenta decisione, motivo, alternative rilevanti, impatti su storie/dati/compatibilità ed evidenze. Decisioni architetturali durature con ADR. Vedere [backlog](../roadmap) e [qualità](./quality).
