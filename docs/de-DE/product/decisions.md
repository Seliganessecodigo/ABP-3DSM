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

D01 und EP00 am 15.10.2026 bestätigt; andere Regeln in Backlog/versionierten Verträgen.

## Offen

| Thema | Klärung | Lieferungen |
| --- | --- | --- |
| Energie | Formel, Koeffizienten, Umrechnung, Annahmen. | #49/#53/#58 |
| Zeit/Abdeckung | Grenzen, Zeitzone, Granularität, Rundung, Teilergebnisse. | #49/#156/#174/#175/#178 |
| Vorschau | Rechte, Volumen-/Zeitraumgrenzen, Faktorwahl. | #91/#263/#264 |
| Zugriff/Konten | Rollen, Bootstrap, Sitzungen, Passwort/Wiederherstellung. | #90/#91/#158/#160/#245 |
| Quellen/Betrieb | Timeout, Retry, Quoten, Parallelität, Verzögerung. | #155/#243 |
| Kontinuität | Aufbewahrung, Backup/Restore, Verfügbarkeit/Leistung. | #110/#120/#125/#166 |
| Figma-Extras | CSV, Spalten, Vorperiode, Effizienz pro Transaktion. | #61/#248/#252 |

PO und technische Verantwortliche klären Umfang/Verhalten, Anbieter bestätigt Quellverträge. Keine erfundenen Termine/Zuweisungen.

## Quellen und Änderungen

Markdown: Vision/Regeln. Issues: Kriterien, Tasks, Abhängigkeiten, Diskussion. Projects: Priorität, Status, Sprint, Daten, PRs; kein Implementierungsnachweis. Figma: Gestaltung/Übergabe, Beispielzahlen kein Vertrag. OpenAPI/Code: Verhalten einer Revision. Externe Verträge: Schemas/Einheiten mit Version/Datum.

Konflikt benennen, zuständig entscheiden, betroffene Quellen zusammen aktualisieren. Figma legitimiert keinen erfundenen Endpoint. Issue/PR dokumentiert Entscheidung, Grund, relevante Alternativen, Folgen für Stories/Daten/Kompatibilität und Belege. Dauerhafte Architekturentscheidungen erhalten ADR. Siehe [Backlog](../roadmap), [Qualität](./quality).
