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
| D06 | I guasti di monitoraggio hanno un incidente per identità e recuperano dopo tre osservazioni valide consecutive. | Limite totale di 30 s per chiamata esterna, massimo tre tentativi HTTP inclusa la chiamata iniziale e retry solo per errori temporanei; i cicli non si sovrappongono e le osservazioni valide vengono conservate. #243. |
| D07 | Query con fuso esplicito normalizzati in UTC, [from,to), bucket UTC orari/giornalieri/mensili/annuali, riferimento unico e rifiuto oltre 10.000 punti. | #174/#235. |
| D08 | Serie su risultati salvati ripartiti per sovrapposizione, senza ricalcolo storico; conflitti per raccolta recente/ID crescente; preservare lacune e snapshot. | #164/#174/#235. |

D01 e EP00 confermati il 15/10/2026; altre regole in backlog/contratti versionati.

## Pendenti

| Tema | Da risolvere | Consegne |
| --- | --- | --- |
| Ricalcolo | Permessi, limiti volume/periodo, fattore. | #91/#263/#264 |
| Accessi/conti | Ruoli, bootstrap, sessioni, password/recupero. | #90/#91/#158/#160/#245 |
| Fonti/operazione | Confermare quote e limiti di concorrenza con i responsabili delle API. La policy di timeout/retry/ritardi di #243 è approvata. | #155/#243 |
| Continuità | Conservazione, backup/ripristino, disponibilità/prestazioni. | #110/#120/#125/#166 |
| Extra Figma | CSV, colonne ed efficienza per transazione. Il dettaglio sovrappone già la serie al periodo precedente equivalente; confronto tra applicazioni e dashboard temporale restano fuori da questo ambito. | #61/#248/#252 |

PO e responsabili tecnici decidono ambito/comportamento; fornitori confermano contratti. Nessuna data o persona assegnata per ipotesi.

## Fonti e modifiche

Markdown: visione/regole. Issue: criteri, task, dipendenze, discussione. Projects: priorità, stato, Sprint, date e PR; non prova implementazione. Figma: intento visivo/handoff, numeri illustrativi non contratto. OpenAPI/codice: revisione esposta. Contratti esterni: schema/unità con versione/data.

Conflitto: esplicitare, decidere col responsabile, sincronizzare fonti. Figma non autorizza endpoint inventati. Issue/PR documenta decisione, motivo, alternative rilevanti, impatti su storie/dati/compatibilità ed evidenze. Decisioni architetturali durature con ADR. Vedere [backlog](../roadmap) e [qualità](./quality).
