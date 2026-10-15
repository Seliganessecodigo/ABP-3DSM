# Requisiti trasversali e accettazione

[EP00](../backlog/ep00) organizza fondamenti e qualità. RNF permanente, task con artefatto finito: completare database non termina l’obbligo di integrità.

## Evidenze di qualità

| Requisito | Evidenza |
| --- | --- |
| RNF-01 — Tecnologie | React/TypeScript e NestJS/TypeScript compilabili. |
| RNF-02 — Responsabilità | UI presenta; backend decide; adapter validano; repository persistono. |
| RNF-03 — Storico | Migration/test di identità, integrità e versioni conservate. |
| RNF-04 — Sicurezza | Segreti fuori Git; autorizzazione nel backend. |
| RNF-05 — Riproducibilità | Ambiente documentato, CI verificabile, pubblicazione validata. |
| RNF-06 — Errori | Successo, vuoto, errore, assenza, stale distinguibili. |
| RNF-07 — Esperienza | Tastiera, focus, contrasto, testo/icone oltre colore, responsive, otto lingue. |

Matrice accessi, conservazione, ripristino e obiettivi numerici disponibilità/prestazioni pendenti. Nessun SLA o certificazione accessibilità dichiarati.

## Scenari di dimostrazione

| Dato / quando | Risultato | Riferimento |
| --- | --- | --- |
| Applicazione conosciuta assente da snapshot completo valido | Registrare rimozione, mantenere storico. | US-02 |
| Fonte in errore o payload invalido | Non confermare rimozione né inventare zero. | US-02/05 |
| Osservazione valida e tentativo seguente fallito | Conservare osservazione, distinguere freschezza. | US-03/04 |
| Energia valida senza fattore | Non inventare CO₂e né scartare energia. | US-07/08 |
| Richiesta anteprima ricalcolo | Originale intatto, anteprima non persistita. | US-12 |
| Operazione amministrativa senza permesso | Backend nega modifica. | US-18/19/20 |

Funzioni pianificate necessitano implementazione/test prima di dichiararle consegnate.

## Prontezza, conclusione e gate

Prima di iniziare: consegna, consumatori, criteri, contratto, dipendenze reali. Coefficienti/permessi pendenti non diventano ipotesi tecniche. Design con stati, navigazione e handoff verificabili.

Conclusione: criteri dimostrati, review, test di errori rilevanti, contratto/documentazione e prove aggiornati. PR aperta non conclude issue. Planning/review/feedback in #134.

PR verso `develop`: check pertinenti e SonarQube Cloud, copertura nuova ≥ 80%, duplicazione ≤ 3%, rating A, 100% hotspot revisionati. Backend eseguibile richiede test/LCOV. Vedere [CI](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/.github/quality-gates.md) e [Contribuire](../contributing). CI non sostituisce accettazione funzionale o valutazione usabilità.
