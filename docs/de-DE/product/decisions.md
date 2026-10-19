# Entscheidungen, Abhängigkeiten und Quellen

Offene Punkte werden nicht stillschweigend zu freigegebenen Funktionen. PDF v1.1 ist historische Referenz; Markdown entwickelt sich per PR und bleibt mit Issues abgestimmt.

## Bestätigt

| ID | Entscheidung | Folge |
| --- | --- | --- |
| D01 | Neuberechnung nur als ungespeicherte Vorschau. | Original bewahren, Vorschau aus Summen/Historie ausschließen. US-12, #263/#264. |
| D02 | Erste Abwesenheit im vollständigen gültigen Snapshot bestätigt Entfernung. | Quellfehler/Metrik-404 entfernt nicht. US-02, #171. |
| D03 | GreenER-Empfang ist kein Quellzeitstempel. | Abgeleitete Intervalle kennzeichnen, Gültigkeit nicht erfinden. #154/#155. |
| D04 | RNFs übergreifend, Grundlagen/Qualität in EP00. | Abgeschlossene Tasks beenden keine Qualitätspflicht. |
| D05 | Regionale Simulation bei gleicher Energie. | Szenario verändert keine Messungen/offiziellen Ergebnisse. US-15. |
| D06 | Monitoringfehler haben je Identität einen Vorfall und gelten nach drei aufeinanderfolgenden gültigen Beobachtungen als behoben. | Insgesamt 30 s Frist pro externem Aufruf, höchstens drei HTTP-Versuche einschließlich des ersten; Wiederholungen nur bei vorübergehenden Fehlern. Zyklen überlappen nicht, gültige Beobachtungen bleiben erhalten. #243. |
| D07 | Abfragen mit Zeitzone nach UTC normalisiert, [from,to), UTC-Buckets je Stunde/Tag/Monat/Jahr, ein Fensteranker und Ablehnung über 10.000 Punkte. | #174/#235. |
| D08 | Serien verwenden gespeicherte, nach Überlappung aufgeteilte Ergebnisse ohne Neuberechnung; Konflikte nach neuester Sammlung/ID aufsteigend; Lücken und Snapshots bewahren. | #164/#174/#235. |

D01 und EP00 am 15.10.2026 bestätigt; andere Regeln in Backlog/versionierten Verträgen.

## Offen

| Thema | Klärung | Lieferungen |
| --- | --- | --- |
| Vorschau | Rechte, Volumen-/Zeitraumgrenzen, Faktorwahl. | #91/#263/#264 |
| Zugriff/Konten | Rollen, Bootstrap, Sitzungen, Passwort/Wiederherstellung. | #90/#91/#158/#160/#245 |
| Quellen/Betrieb | Quoten und Parallelitätsgrenzen mit den API-Verantwortlichen bestätigen. Die Timeout-/Retry-/Verzögerungsrichtlinie aus #243 ist freigegeben. | #155/#243 |
| Kontinuität | Aufbewahrung, Backup/Restore, Verfügbarkeit/Leistung. | #110/#120/#125/#166 |
| Figma-Extras | CSV, Spalten, Vorperiode, Effizienz pro Transaktion. | #61/#248/#252 |

PO und technische Verantwortliche klären Umfang/Verhalten, Anbieter bestätigt Quellverträge. Keine erfundenen Termine/Zuweisungen.

## Quellen und Änderungen

Markdown: Vision/Regeln. Issues: Kriterien, Tasks, Abhängigkeiten, Diskussion. Projects: Priorität, Status, Sprint, Daten, PRs; kein Implementierungsnachweis. Figma: Gestaltung/Übergabe, Beispielzahlen kein Vertrag. OpenAPI/Code: Verhalten einer Revision. Externe Verträge: Schemas/Einheiten mit Version/Datum.

Konflikt benennen, zuständig entscheiden, betroffene Quellen zusammen aktualisieren. Figma legitimiert keinen erfundenen Endpoint. Issue/PR dokumentiert Entscheidung, Grund, relevante Alternativen, Folgen für Stories/Daten/Kompatibilität und Belege. Dauerhafte Architekturentscheidungen erhalten ADR. Siehe [Backlog](../roadmap), [Qualität](./quality).
