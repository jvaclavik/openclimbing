# Kletterglück – Aufgabenübergabe

Status: Geplant, noch nicht umgesetzt. Diese Datei ist die gemeinsame Übergabe zwischen Schnellchat und Work-Modus.

## Beschlossene Änderungen

1. **Registrierung und Anmeldung entfernen.** Bestehende Login-/Registrierungsoberflächen und nicht mehr benötigte Authentifizierungslogik nach Prüfung der Abhängigkeiten entfernen. Keine OpenStreetMap-Anmeldung voraussetzen. Bestehende Funktionen und Daten nicht unkontrolliert löschen.
2. **Keine Komoot-Anmeldung oder Freundesynchronisierung.** Keine eigene Community- oder Freundesverwaltung einführen.
3. **Favoriten ohne Konto ermöglichen.** Klettersteige individuell markieren; lokale Speicherung als einfache Lösung prüfen. Einschränkung: Ohne Synchronisierung bleiben Favoriten geräte-/browsergebunden.
4. **Besuchte Klettersteige hervorheben.** Besuchte Steige in Liste/Karte erkennbar machen; zugehörige vorhandene Videos in der Detailansicht schnell abspielbar machen, soweit Dateien/Zuordnungen vorhanden sind.
5. **Schwierigkeitsfilter auf Klettersteige ausrichten.** Normale Sportkletter-/UIAA-/französische Schwierigkeitsfilter aus der Oberfläche entfernen, soweit vorhanden. Stattdessen ausschließlich Klettersteiggrade A bis F als Mehrfachauswahl anbieten, standardmäßig alle aktiv. Kombinierte Grade (z. B. B/C, C/D) nach einer klar dokumentierten Logik berücksichtigen. Unbekannte Grade separat behandeln; nicht willkürlich zuordnen. Filter muss in Karte und Liste konsistent wirken und auf Mobilgeräten gut bedienbar sein.


6. **via-ferrata.de als externe Informationsquelle prüfen.** Für vorhandene Klettersteige passende Detailseiten anhand Name und Lage möglichst zuverlässig zuordnen. Primäres Ziel ist die Anzeige von Tourenbeschreibung, Bewertungen, Erfahrungsberichten, Fotos und aktuellen Hinweisen direkt innerhalb der Kletterglück-Detailansicht, ohne Safari-Wechsel. Zuerst offizielle API, erlaubte Einbettung oder anderweitig ausdrücklich gestattete Datennutzung prüfen. Prüfen, ob Schwierigkeit, Dauer und aggregierte Sternebewertungen rechtlich zulässig und technisch stabil eingebunden werden können. Keine pauschale Übernahme von urheberrechtlich geschützten Beschreibungen, Fotos oder Nutzerrezensionen und kein Massenscraping ohne geklärte Rechte. Bei fehlender API/Freigabe keine fremden Inhalte kopieren oder unzulässig einbetten; die Funktion als blockiert/offen dokumentieren statt externe Links als vollwertige Umsetzung auszugeben. Eine interne Webansicht nur prüfen, wenn technisch möglich und durch Website-Regeln erlaubt. Quellenhinweise sichtbar machen; fremde Daten nicht als eigene ausgeben.

## Zusätzliche Idee zur Prüfung (nicht beschlossen)

- **Schnellfilter „Für uns passend“**: Optional eine einfache Voreinstellung für bevorzugte Schwierigkeitsgrade, ohne Nutzerkonto. Nur umsetzen, wenn die Oberfläche dadurch wirklich einfacher wird; ansonsten weglassen.

## Umsetzungshinweise für Work

- Zuerst Repository und vorhandene Authentifizierung, Datenhaltung, Karten- und Videoansichten untersuchen; nicht blind löschen.
- Favoriten und besuchte Steige als getrennte Zustände behandeln.
- Vorhandene Videodateien und Zuordnungen wiederverwenden, keine Videos erfinden.
- Änderungen in einem eigenen Branch und Pull Request vorbereiten; Tests und Mobilansicht prüfen.
- Keine automatische Veröffentlichung oder Löschung produktiver Nutzerdaten ohne gesonderte Freigabe.
- Nach Umsetzung Status und PR-Link hier dokumentieren.
