# Gemeinsame Testversion

Der Vorschau-Branch `codex/kletterglueck-central-tours` führt den zentralen
Tourenspeicher, den Tourenchat aus PR #24 und die Projektregeln aus PR #25 zusammen.
Die Produktion auf `master` wird dadurch nicht verändert. Die beiden ergänzenden
PRs nicht erneut übernehmen, ohne den dann aktuellen Diff zu prüfen.

## Bestehende Konfiguration

Die Vorschau verwendet die bereits diesem Branch zugeordneten serverseitigen
Supabase-Variablen. Sie arbeitet mit dem bestehenden Tourenkatalog, nicht mit einer
Datenbankkopie. Testimporte oder Änderungen würden deshalb echte gespeicherte
Daten verändern. Diese Zusammenführung führt keine Migration oder Schreibtests
aus und ändert den Zugriffsschutz nicht.

Der Chat bleibt ausschließlich in Preview sichtbar und erreichbar. Er verwendet
OpenAI über Vercel AI Gateway mit der Projektidentität (OIDC); kein neuer API-Key
oder Connector ist nötig. Das vorhandene Projektbudget wird nicht verändert.
Siehe [Tourenchat](tourenchat.md) für Kosten, Datenübertragung und Grenzen.

## Gemeinsamer Test

- Geschützte Vorschau öffnen; Karte und Klettersteigdetails prüfen.
- Auf einen bereits gespeicherten Track zoomen und dessen Anzeige prüfen.
- Tourenhilfe antippen, die Karte dabei verschieben, eine konkrete Ortsfrage und eine Folgefrage stellen.
- Einen angebotenen Kartenlink öffnen und mit den Quellen vergleichen.
- Fehlende Wetter-, Sperrungs- und Schwierigkeitsdaten dürfen nicht erfunden werden.
- Mobile Ansicht prüfen. Vor einer späteren öffentlichen Freigabe Zugangskontrolle
  und dauerhaftes Rate-Limiting ergänzen; die Preview-Sperre nicht einfach entfernen.

Die lokalen Tests simulieren KI und Datenbank. Erfolgreiche Tests ersetzen nicht
die Prüfung der tatsächlich bereitgestellten Vorschau.
