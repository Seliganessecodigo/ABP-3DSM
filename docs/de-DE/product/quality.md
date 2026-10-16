# Übergreifende Anforderungen und Abnahme

[EP00](../backlog/ep00) organisiert Grundlagen und Qualität. Ein RNF gilt dauerhaft; sein Task liefert ein endliches Artefakt. Datenbankeinrichtung beendet nicht die Integritätspflicht.

## Qualitätsnachweise

| Anforderung | Nachweis |
| --- | --- |
| RNF-01 — Technologien | Buildfähiges React/TypeScript und NestJS/TypeScript. |
| RNF-02 — Verantwortung | UI zeigt; Backend entscheidet; Adapter validieren; Repositories speichern. |
| RNF-03 — Historie | Migrationen/Tests für Identität, Integrität, Versionsbewahrung. |
| RNF-04 — Sicherheit | Geheimnisse außerhalb Git, Autorisierung im Backend. |
| RNF-05 — Reproduzierbarkeit | Dokumentierte Umgebung, prüfbare CI, validierte Veröffentlichung. |
| RNF-06 — Fehler | Erfolg, leer, Fehler, fehlend, stale unterscheidbar. |
| RNF-07 — Nutzung | Tastatur, Fokus, Kontrast, Text/Icons statt nur Farbe, responsive, acht Sprachen. |

Zugriffsmatrix, Aufbewahrung, Wiederherstellung und numerische Verfügbarkeits-/Leistungsziele bleiben offen. Kein SLA und keine Barrierefreiheitszertifizierung.

## Abnahmeszenarien

| Ausgangslage / Aktion | Erwartung | Referenz |
| --- | --- | --- |
| Bekannte Anwendung fehlt im vollständigen gültigen Snapshot | Entfernung erfassen, Historie bewahren. | US-02 |
| Quellfehler oder ungültige Nutzlast | Keine Entfernung bestätigen, keine Null erfinden. | US-02/05 |
| Gültige Beobachtung, nächster Versuch schlägt fehl | Beobachtung bewahren, Aktualität unterscheiden. | US-03/04 |
| Gültige Energie, kein Faktor | CO₂e nicht erfinden, Energie nicht verwerfen. | US-07/08 |
| Neuberechnungsvorschau | Original unverändert, Vorschau nicht gespeichert. | US-12 |
| Administrative Aktion ohne Recht | Backend verweigert Änderung. | US-18/19/20 |

Geplante Funktionen brauchen Implementierung und Tests vor Lieferankündigung.

## Bereitschaft, Abschluss und Gate

Vor Beginn: Ergebnis, Verbraucher, Kriterien, Vertrag und echte Abhängigkeiten benennen. Offene Koeffizienten/Rechte werden nicht zu technischen Annahmen. Design braucht Zustände, Navigation und überprüfbare Übergabe.

Abschluss: Kriterien demonstrieren, Code prüfen, relevante Fehler testen, Vertrag/Dokumentation und Belege aktualisieren. Offene PR beendet kein Issue. Planning/Review/Feedback gehören zu #134.

PRs nach `develop`: passende Checks und SonarQube Cloud, neue Abdeckung ≥ 80%, Duplikation ≤ 3%, A-Ratings, 100% Hotspots geprüft. Ausführbares Backend: Tests/LCOV. Siehe [CI](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/.github/quality-gates.md) und [Mitwirken](../contributing). CI ersetzt weder funktionale Abnahme noch Nutzbarkeitstest.
