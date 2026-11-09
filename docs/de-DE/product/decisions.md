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
| Quellen/Betrieb | Quoten und Parallelitätsgrenzen mit den API-Verantwortlichen bestätigen. Die Timeout-/Retry-/Verzögerungsrichtlinie aus #243 ist freigegeben. | #155/#243 |
| Kontinuität | Aufbewahrung, Backup/Restore, Verfügbarkeit/Leistung. | #110/#120/#125/#166 |
| Figma-Extras | CSV, Spalten und Effizienz pro Transaktion. Das Detail überlagert die Reihe bereits mit dem entsprechenden Vorzeitraum; anwendungsübergreifender Vergleich und Perioden-Dashboard bleiben eigener Umfang. | #61/#248/#252 |

PO und technische Verantwortliche klären Umfang/Verhalten, Anbieter bestätigt Quellverträge. Keine erfundenen Termine/Zuweisungen.

## Quellen und Änderungen

Markdown: Vision/Regeln. Issues: Kriterien, Tasks, Abhängigkeiten, Diskussion. Projects: Priorität, Status, Sprint, Daten, PRs; kein Implementierungsnachweis. Figma: Gestaltung/Übergabe, Beispielzahlen kein Vertrag. OpenAPI/Code: Verhalten einer Revision. Externe Verträge: Schemas/Einheiten mit Version/Datum.

Konflikt benennen, zuständig entscheiden, betroffene Quellen zusammen aktualisieren. Figma legitimiert keinen erfundenen Endpoint. Issue/PR dokumentiert Entscheidung, Grund, relevante Alternativen, Folgen für Stories/Daten/Kompatibilität und Belege. Dauerhafte Architekturentscheidungen erhalten ADR. Siehe [Backlog](../roadmap), [Qualität](./quality).

## Entscheidungen und Abhängigkeiten — c343698

Unter `/administration/calculations` Anwendung/Datum wählen und Original/Vorschau vergleichen. Enddatum umfasst den ganzen UTC-Tag; API verwendet `[from,to)`. Öffentliche Vorschau mit aktuellem Modell und aktuellen Faktoren historischer Regionen, ohne Speicherung. Grenzen: 30 Tage, 10.000 Beobachtungen. Antwort: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Faktorfehler erhält berechenbare Energie; CO₂e bleibt nicht verfügbar. Prozente verlangen gleiche Einheiten/Abdeckung und positiven Referenzwert.

Dashboard und Umweltabfragen sind öffentlich. `/login`: E-Mail/Passwort oder aktiviertes Google. Admin benötigt sechsstelligen TOTP, auch nach Google; Analyst/Visitor erhalten keine Verwaltungsrechte. Frontend-Sitzung nur im Speicher; Neuladen verlangt Anmeldung. Backend prüft JWT, Sitzung, aktuelle Rolle und Kontostatus: 401 bei fehlender/ungültiger Anmeldung, 403 bei unzureichender Rolle. Neue Routen sind standardmäßig geschützt.

Admin derselben Organisation ändert Konten zwischen `ACTIVE`, `BLOCKED`, `DEACTIVATED`, mit `expectedStatus` und Begründung. Sperre/Deaktivierung widerruft alle Sitzungen; Reaktivierung erfordert neue Anmeldung. Eigenes Konto und letzter aktiver Admin sind geschützt. Erwartungskonflikt: 409; Ziel bereits erreicht: idempotenter Erfolg. Gemeinsames Audit speichert Erfolg in der Transaktion und Ablehnungen außerhalb des Rollbacks, mit explizitem Akteur und ohne Geheimnisse. Keine vollständige Rollenverwaltung oder Passwortwiederherstellung durch diese Route.

Offen: eigener Vergleich mehrerer Anwendungen, regionale Simulation, allgemeine Benutzer-/Rollenverwaltung, Passwortselbsthilfe, globale Überwachungseinstellungen/Pause und CSV. Impact-Sortierung existiert. Externe Quoten, Aufbewahrung, Backup/Wiederherstellung und Betriebsziele brauchen Entscheidungen; kein SLA. TOTP-Wiederherstellung durch Support ist kein Passwortreset.
