# Entwicklungsprinzipien

Epics, Stories und Aufgaben strukturieren das Produkt mit überprüfbaren Kriterien und Codeverweisen. Issues, Pull Requests und Commits verbinden Anforderungen, Implementierung und Tests; die versionierte Dokumentation vereint Architektur, Verträge, Betrieb und Nachweise.

## Produktregeln {#rules}

| Regel | Bedeutung |
| --- | --- |
| Erhaltener Verlauf | Einstellungen und Vorschauen ersetzen keine Originalergebnisse. |
| Explizite Lücken | Fehler, fehlende Metriken und ältere Daten bleiben von Null unterscheidbar. |
| Öffentliche Abfrage | Kennzahlen lesen ist öffentlich; Einstellungen speichern und Konten verwalten verlangt Berechtigung. |

## Integrierte Fähigkeiten {#planned}

Die Plattform bietet Anwendungsvergleich, Umweltranking, regionale Simulation, Benutzer- und Rollenverwaltung, Passwortwiederherstellung und Überwachungssteuerung. JWT, Google SSO und ein zweiter TOTP-Faktor schützen administrative Abläufe; Umweltabfragen bleiben öffentlich.

## Schätzmodell {#method}

Ein vereinfachtes Modell schätzt Energie anhand von CPU, Speicher, Festplatte und Netzwerk im Beobachtungsintervall. Geschätzte Leistung wird über die Dauer in Energie umgerechnet. Emissionen ergeben sich aus Energie mal regionaler CO₂-Intensität. Die Koeffizienten gehören zum akademischen Modell, nicht zu direkter Strommessung oder offiziellen Regionalfaktoren. Ergebnisse erhalten ursprüngliche Methodik und Faktoren.

## Abnahmekriterien {#acceptance}

Die Oberfläche verknüpft Kennzahlen mit Zeitraum, Einheit, Abdeckung und Methodik und erhält Filter sowie Navigationskontext. Lade-, Leer-, Fehler- und veraltete Datenzustände werden ausdrücklich behandelt. Tastaturbedienung, sichtbarer Fokus, Text zusätzlich zu Farbe, Mobilgeräte, Themes und 12 Sprachen gehören zur Nutzungserfahrung.

## Weiterführende Seiten {#related}

[Produkt-Backlog](../roadmap) · [Methodik und Daten](../product/methodology)
