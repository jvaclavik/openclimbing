# OpenClimbing / Klettersteig-Karte – Projektkontext und Übergabe

**Stand:** 05.11.2026  
**Zielgruppe:** Cursor Cloud Agent und andere KI-Entwicklungsagenten  
**Repository:** https://github.com/mandala-wt/openclimbing  
**Sprache der Zusammenarbeit:** Deutsch

> **Wichtig:** Dieses Dokument ist eine Übergabe aus bisherigen Gesprächen und einem von Cursor erstellten Bestandsbericht. Es ist **keine** Garantie, dass der aktuelle Repository-Stand unverändert ist. Vor Änderungen den Code, die Konfiguration und den aktuellen Git-Status selbst prüfen. **Bestätigte Tatsachen, Berichtsangaben, Wünsche und offene Fragen nicht vermischen.**

## Aktueller Stand (05.11.2026 Abend, verifiziert)

Die Abschnitte darunter bleiben die ursprüngliche Übergabe. Seitdem ist Folgendes erledigt; nicht mehr als offen behandeln:

- **PR #1, #2, #3 und #5 sind in `master` gemergt.** `vps-deploy.yml` ist gelöscht.
- Die App läuft öffentlich auf **Vercel**: [https://klettersteig-karte.vercel.app](https://klettersteig-karte.vercel.app). Team „OpenClimbing“, Production-Branch `master`. Jeder Merge auf `master` wird automatisch live.
- Deutsch, Klettersteig-Schalter, Grad A–F und Startausschnitt Franken/Alpen sind in `master`.
- Auf Hosts ohne lokale SQLite (also Vercel) sind **Meine Listen, Ticks, Kletterprofil und Rangliste ausgeblendet** (`HAS_USER_DB` in `src/services/osm/consts.ts`).
- Die Kletter-Kacheln kommen weiter von `openclimbing.org`. Eine eigene Datenbank gibt es auf Vercel nicht.
- Cursor-Umgebung: `.cursor/environment.json` und `.cursor/cloud-agent-start.sh` liegen im Repo.

**Dadurch veraltet in den Abschnitten 3, 5, 9 und 10:** Die Frage, ob PR #1 gemergt ist; ob Start/Build/Test schon gelaufen sind; die Empfehlung, Vercel nicht zu nutzen. Die Oberfläche läuft bewusst auf Vercel. Ein eigener Docker-Server bleibt nur nötig, wenn eigene Kacheln oder Nutzerlisten gewünscht sind.

**Noch offen, nicht ungefragt anfassen:**

1. Eigene Schlüssel für MapTiler und OSM-/Wikimedia-Login (die in `.env` gehören dem Originalprojekt).
2. Optional eine eigene Domain.
3. Produktarbeit an Karte, Filtern, Deutsch und iPhone/iPad.

Raspberry Pi nicht verändern. Keine Secrets ausgeben.

## 1. Das Vorhaben in einem Satz

Aus einem bereits existierenden Open-Source-Projekt soll schrittweise eine **eigene, moderne, deutschsprachige Klettersteig-Web-App** entstehen, die sich auf Klettersteige in Deutschland und Österreich, insbesondere Franken und den Alpen, konzentriert, auf iPhone/iPad gut funktioniert und langfristig unabhängig vom privaten Raspberry Pi öffentlich erreichbar ist.

## 2. Eigentümer, Arbeitsweise und wichtigste Erwartungen

- Der Nutzer betreibt das GitHub-Repository **`mandala-wt/openclimbing`** und hat darauf Schreibrechte.
- Er hat die bestehende App einer anderen Entwicklerin bzw. eines anderen Entwicklers als Grundlage übernommen/geforkt/geklont und möchte **darauf aufbauen, nicht neu anfangen**.
- Er arbeitet hauptsächlich mit **iPad und iPhone**, **ohne Laptop/Desktop als reguläre Arbeitsumgebung**.
- **Cursor Cloud Agents** sollen die eigentliche Entwicklungsarbeit übernehmen: Code untersuchen, Änderungen vorbereiten, Tests durchführen, Fehler beheben, Vorschauen liefern und GitHub-Änderungen vorschlagen.
- Der Nutzer möchte **wenig Terminalarbeit**, kurze verständliche Erklärungen, klare Empfehlungen und möglichst viel selbstständige Arbeit durch den Agenten.
- Kommunikation **auf Deutsch**, technisch korrekt, aber ohne unnötigen Fachjargon.
- Keine unkontrollierten Umbauten. Vor riskanten, destruktiven oder kostenpflichtigen Aktionen Rücksprache halten. Bestehende lauffähige Version schützen.
- Der Nutzer möchte mit dem Agenten **über die App sprechen können, wie mit einem Entwickler**: Ziele beschreiben, Vorschläge und Vorschau bekommen, dann entscheiden.

## 3. Ausgangspunkt und bisheriger Verlauf

### 3.1 Bestehendes Repository

- GitHub: **https://github.com/mandala-wt/openclimbing**
- Zum Zeitpunkt einer verbundenen GitHub-Abfrage am 05.11.2026: Repository **öffentlich**, nicht archiviert, **Schreibrechte vorhanden**, Standardbranch **`master`**.
- Das Projekt ist laut Cursor-Bericht ein Fork von **`jvaclavik/openclimbing`**, ursprünglich im Umfeld **OsmAPP**, mit **GPL-3.0**-Lizenz. Lizenz im Repository nochmals konkret prüfen.
- **Cursor war bereits mit dem GitHub-Konto verbunden**: Der Nutzer konnte das Repository `openclimbing` bei der Erstellung eines Cursor Cloud Agents auswählen.

### 3.2 Bereits geleistete Anpassungen / bisherige Installation

In einer früheren Arbeitssitzung wurde ein GitHub-Pull-Request **#1** für das Repository erstellt; als Ergebnis wurden unter anderem folgende Änderungen beschrieben:

- Deutsche Oberfläche und Name **„Klettersteig-Karte“**.
- Kartenausschnitt über **Franken und dem nördlichen Alpenraum**.
- Klettersteige als auffällige, kupferfarbene Linien/Seilsymbole.
- Schalter **„Klettersteig“**, um andere Kategorien auszublenden.
- Anzeige von **Schwierigkeitsgraden A–F** am Namen.
- Docker-Image für **Raspberry Pi 5**.

Der Nutzer bestätigte nach einer Anleitung, dass die Installation bzw. Nutzung auf seinem Pi **funktionierte**. **Nicht automatisch daraus ableiten**, dass PR #1 inzwischen gemergt ist oder alle beschriebenen Funktionen noch im aktuellen `master` vorhanden sind. Das muss der Agent anhand von GitHub und laufender App prüfen.

### 3.3 Raspberry-Pi-Bestand

- Ein **Raspberry Pi 5 (8 GB)** ist vorhanden und wird für verschiedene Projekte, Docker und Dienste verwendet.
- Die Klettersteig-App wurde auf dem Pi eingerichtet und konnte genutzt werden.
- **Tailscale** wurde im Zusammenhang mit dem externen Zugriff besprochen/eingerichtet; der Nutzer bestätigte eine funktionierende Nutzung. Die konkrete Erreichbarkeit der Klettersteig-App außerhalb des Heimnetzes und die aktuellen Ports/URLs müssen geprüft werden.
- **Wichtig:** Bestehende Pi-Installation vorerst **nicht verändern oder abschalten**. Sie soll bis zur erfolgreichen Cloud-Migration als funktionierende Referenz/Rückfallmöglichkeit dienen.

### 3.4 Cursor Cloud Agent

- Der Nutzer hat sich bei Cursor Cloud Agents angemeldet und konnte **`mandala-wt/openclimbing`** auswählen.
- Ein erster Auftrag lautete: **vollständige Bestandsaufnahme ohne Änderungen**.
- Cursor hat daraufhin einen **siebenseitigen technischen Bestandsbericht** erstellt, datiert 05.11.2026.
- Der Bericht wurde in einem früheren Chat als PDF übergeben. Die wesentlichen Erkenntnisse sind in Abschnitt 4 dokumentiert.
- Als nächster Auftrag wurde vorgeschlagen: **App in einer Entwicklungsumgebung starten, Build/Tests und Funktion von Karte, Filtern, Suche, API und mobiler Darstellung prüfen; ohne Repository-Änderungen oder Deployment.**
- **Offen:** Ob dieser zweite Auftrag bereits ausgeführt wurde und mit welchem Ergebnis. Nicht als erledigt behaupten.

## 4. Technischer Ist-Zustand laut Cursor-Bestandsbericht (05.11.2026)

**Quelle:** „OpenClimbing – technischer Bestandsbericht“, sieben Seiten, von Cursor erstellt. Angaben vor Implementierungen anhand des tatsächlichen Codes verifizieren.

### 4.1 Technologie

| Bereich           | Berichteter Stand                                         |
| ----------------- | --------------------------------------------------------- |
| Sprache           | TypeScript / JavaScript                                   |
| Web-App           | Next.js 15, Pages Router                                  |
| Oberfläche        | React 19, Material UI                                     |
| Interaktive Karte | MapLibre GL                                               |
| Datenbank         | SQLite, `better-sqlite3`                                  |
| Geodaten          | OpenStreetMap, Overpass API, Turf.js                      |
| Anmeldung         | OpenStreetMap OAuth, Wikimedia                            |
| Routing           | GraphHopper (optional)                                    |
| Betrieb           | Docker, GitHub Actions; ursprünglich VPS-orientiert       |
| Qualität          | Jest, ESLint, Prettier, Sentry                            |
| Mobil             | Responsives Layout, PWA-Manifest, iOS-Home-Screen-Nutzung |

### 4.2 Relevante Codebereiche laut Bericht

- `pages/` – Seiten und API-Endpunkte
- `src/components/Map/` – Karte, Ebenen, Filter, 3D, Sonne/Schatten
- `src/components/FeaturePanel/` – Objekt-/Tourendetails und Editor
- `src/server/climbing-tiles/` – OSM-Verarbeitung, Kacheln, SQLite
- `src/server/db/` – Datenbankschema und Zugriff
- `src/services/` – externe Dienste
- `src/locales/` – Übersetzungen, einschließlich `de.js`
- `public/` – Icons, PWA-Manifest, statische Dateien

### 4.3 Laut Bericht bereits vorhanden

- Interaktive Karte mit Klettersteig-Linien und eigenen Icons.
- Schnellfilter „Nur Klettersteige“.
- Filter für Typ, Grad, Länge, Material usw.
- Umrechnung/Anzeige von Klettersteig-Schwierigkeiten (u. a. **K1–K6, A–F**).
- Tourendetails aus OSM-Tags (Name, Schwierigkeitsgrad, Links usw.).
- Seite `/via-ferratas` als Verzeichnis.
- Suche, Routing mit GraphHopper, 3D-Gelände, Sonne/Schatten.
- Mobilansicht und PWA.
- Deutsch als Standardsprache in diesem Fork.
- Startausschnitt Franken/nördliche Alpen (im Bericht ungefähr **48,5° N, 11° E**).

### 4.4 Laut Bericht fehlend oder verbesserungsbedürftig

- **GPX-Import und GPX-Export** für Klettersteige.
- Eine **dedizierte Klettersteig-Tourenplanung**.
- **Deutsche Übersetzungen unvollständig** (Bericht nennt ungefähr 198 fehlende Schlüssel gegenüber Englisch; Zahl prüfen).
- **Uneinheitliches Branding** zwischen „OpenClimbing“ und „Klettersteig-Karte“.
- Viele allgemeine Felskletter-Funktionen, die für die Klettersteig-Fokussierung eventuell optional oder störend sind.
- Eigene Kletter-/Klettersteig-Kacheln erfordern Serververarbeitung und persistente Datenhaltung.

### 4.5 Daten und externe Dienste

- **OpenStreetMap** ist die wesentliche Quelle für Wege, Klettersteige, Schwierigkeitsgrade und Geometrien.
- **Overpass API** wird für OSM-Abfragen/Tile-Refresh genutzt.
- **SQLite** speichert nach Bericht einen Cache/Index (z. B. `climbing_features`, Tiles, optionale Nutzerlisten/Ticks), **keine unabhängig gepflegte proprietäre Klettersteig-Datenbank**.
- **MapTiler/Thunderforest** können Hintergrundkarten liefern; API-Schlüssel und Nutzungsbedingungen beachten.
- **Wikimedia Commons** liefert Bilder/Topos, mit individuellen Lizenzbedingungen.
- **GraphHopper** für Routenberechnung ist optional und kann Kontingentgrenzen haben.
- **OSM OAuth** ist für Bearbeitungs-/Loginfunktionen relevant.
- **Sentry/Umami** sind optional für Fehlerüberwachung/Statistik.

## 5. Hosting-Entscheidung: Warum nicht einfach Vercel?

### Frühere Überlegung

Zunächst wurde erwogen, den Code mit Cursor zu entwickeln, in GitHub zu verwalten und die fertige Web-App **bei Vercel** zu hosten, um vom Pi unabhängig zu sein.

### Nach der technischen Analyse korrigierte Empfehlung

**Für den vollständigen bestehenden Funktionsumfang ist ein kleiner Cloud-Server mit Docker und persistentem Speicher wahrscheinlich geeigneter als ein reines Vercel-Deployment.**

Begründung laut Cursor:

- Die Anwendung nutzt **SQLite mit dauerhaftem Dateispeicher**.
- Die Verarbeitung/Erneuerung eigener Kletter-Kacheln benötigt teils längere Serverprozesse.
- Eine reine Vercel-Vorschau kann offenbar Kacheln von **`openclimbing.org`** beziehen. Das wäre jedoch eine Abhängigkeit vom ursprünglichen Dienst.
- Eine vollständig unabhängige Vercel-Architektur würde Backend-/Datenbank-/Tile-Umbauten erfordern.
- Vorhandenes **Dockerfile** und Next.js-Backend sprechen für einen Container-Server.

**Aktuelle Arbeitsempfehlung:** kleiner VPS oder Containerhost (z. B. Hetzner, Railway oder Fly.io), Next.js und Backend gemeinsam im Docker-Container, SQLite auf persistentem Volume, regelmäßiger Tile-Refresh und Backups.

**Wichtig:** Dies ist eine Architektur-Empfehlung, **noch keine gebuchte oder umgesetzte Hosting-Lösung**. Den tatsächlichen Ressourcenbedarf, ARM/x86-Kompatibilität, Dateisystem, Sicherheit, Backup und Preise vor Auswahl prüfen.

**Kosten aus dem Cursor-Bericht:** kleiner VPS grob **3–8 € pro Monat**, zusätzlich ggf. Domain, Kartenanbieter und weitere API-Dienste. **Schätzung, kein verbindliches Angebot.**

**Priorität:** Nicht sofort Hosting kaufen. Erst Anwendung zuverlässig starten und den Ist-Zustand prüfen, dann konkrete Architektur und Deployment planen.

## 6. Produktvision und gewünschte Funktionen

### Kernziel

Eine übersichtliche, schnelle, **deutschsprachige Klettersteig-Karte** für die eigene Tourenrecherche und später Tourenplanung, insbesondere auf **iPhone und iPad**. Schwerpunkt **Deutschland und Österreich / Alpenraum**. Die Karte soll Klettersteige klar von anderen Kletterangeboten unterscheiden.

### Bereits konkret besprochen

1. **Interaktive Karte** mit klar erkennbaren Klettersteigen.
2. **Klettersteig-only-Filter**, der allgemeine Kletter- und Halleninhalte ausblenden kann.
3. **Schwierigkeitsgrade A–F** gut sichtbar und sinnvoll filterbar; vorhandene K1–K6-Konvertierung prüfen.
4. **Deutschsprachige Bedienung** und konsistenter Name „Klettersteig-Karte“.
5. **Fokus Franken / nördliche Alpen** als Startausschnitt; später breiterer Alpenraum.
6. **Touren-/Objektdetails** mit nützlichen OSM-Informationen.
7. **Mobile, touchfreundliche Nutzung** und PWA auf iOS/iPadOS.
8. **GPX-Funktionen** als späterer Ausbauschritt.
9. **Tourenplanung** als späterer Ausbauschritt.
10. **Öffentliche Erreichbarkeit ohne Abhängigkeit vom privaten Raspberry Pi** als längerfristiges Betriebsziel.

### Weitere frühere Ideen, noch nicht als verbindlicher Umfang festgelegt

- Erweiterte Filter für Deutschland/Österreich und weitere Schwierigkeits-/Tourenmerkmale.
- Übersicht/Verzeichnis und Tourensuche verbessern.
- Kartendarstellung und mobile Bedienung optimieren.

**Nicht ungefragt neue Großfunktionen, Benutzerkonten, Bezahlsysteme oder eigene Datenquellen einführen.** Zuerst mit dem Nutzer priorisieren.

## 7. Rechtliches und Lizenzen

- Der Cursor-Bericht bezeichnet die Software als **GPL-3.0**. Original-Lizenzdatei und Drittanbieter-Lizenzen im aktuellen Repository prüfen.
- Ursprüngliche Autorenschaft und Lizenzhinweise beibehalten.
- **OSM-Daten** stehen unter **ODbL**: korrekte Attribution und Datenbankpflichten beachten.
- **Wikimedia-Bilder** können individuelle CC-Lizenzen und Namensnennung erfordern.
- **Kartenanbieter** (z. B. MapTiler/Thunderforest) haben eigene API-Nutzungsbedingungen.
- Vor öffentlichem Deployment die rechtlichen Pflichten für die konkrete Verteilung/Bereitstellung prüfen; insbesondere keine pauschale Annahme, dass jeder Webbetrieb automatisch identische Quellcode-Pflichten wie eine Softwareweitergabe auslöst.

## 8. Zusammenarbeit mit Cursor: verbindliche Arbeitsregeln

1. **Erst Ist-Zustand prüfen:** Repository, Branch, offene Pull Requests, laufende Tests, vorhandene Konfiguration und jüngste Änderungen sichten.
2. **Nicht neu bauen**, solange vorhandene Komponenten die Aufgabe sinnvoll erfüllen.
3. **Keine unaufgeforderten Änderungen an `master`**; für Änderungen separate Branches und nachvollziehbare Pull Requests verwenden.
4. **Keine ungefragten kostenpflichtigen Aktionen**, Serverbestellungen, Domainkäufe oder Deployments.
5. **Keine Secrets veröffentlichen**: API-Schlüssel, OAuth-Secrets, private URLs, Tokens und Umgebungsvariablen sicher behandeln.
6. **Raspberry Pi nicht ungefragt verändern**: Die bisherige Installation dient als Referenz und Rückfallmöglichkeit.
7. **Vor größeren Architekturänderungen** einen kurzen Plan mit Nutzen, Nachteilen, Kosten und Auswirkungen vorlegen.
8. **Tests und Nachweise liefern:** Build, relevante Tests, manuelle Prüfung von Karte/Filtern, iPhone-/iPad-Ansicht; Fehler klar benennen.
9. **Bei jeder Lieferung verständlich berichten:** Was wurde geändert? Was funktioniert? Was ist noch offen? Wie kann der Nutzer es auf dem iPad prüfen?
10. **Nicht behaupten, etwas getestet oder deployed zu haben, wenn es nicht wirklich ausgeführt wurde.**
11. **Sparsam nachfragen**: Nur bei entscheidenden Produkt-, Kosten-, Berechtigungs- oder Sicherheitsfragen.

## 9. Nächster sinnvoller Arbeitsauftrag (Stand der Übergabe)

**Phase 1 – Lauffähigkeit prüfen, noch ohne Codeänderungen**

- GitHub-Status und PRs prüfen, insbesondere den Stand von PR #1 und des `master`-Branches.
- App in der Cursor-Entwicklungsumgebung starten.
- Abhängigkeiten, Umgebungsvariablen und notwendige API-Schlüssel erfassen, ohne geheime Werte offenzulegen.
- Produktions-Build und vorhandene automatisierte Tests ausführen, soweit möglich.
- Prüfen: Karte, Klettersteig-Layer, Schwierigkeitsgrade, Filter, Suche, Tourendetails, OSM/Overpass-/Tile-Verfügbarkeit.
- Mobilansichten für iPhone/iPad und PWA-Verhalten prüfen.
- Eine Vorschau oder Screenshots und einen kompakten Fehlerbericht liefern.
- **Keine Änderungen, Commits, Pull Requests, Deployments oder kostenpflichtigen Aktionen in dieser Prüfphase.**

**Phase 2 – Prioritäten gemeinsam festlegen**

- Kritische Fehler beheben.
- Branding und deutsche Übersetzungen konsistent machen.
- Bedienung und Darstellung für Klettersteige und iPad/iPhone verbessern.
- GPX/Tourenplanung erst nach Priorisierung angehen.

**Phase 3 – Hosting unabhängig vom Pi**

- Docker-/SQLite-/Tile-Architektur und Backup testen.
- Konkrete Hosting-Optionen und tatsächliche Kosten vergleichen.
- Sicherheits- und Lizenzcheck.
- Erst nach ausdrücklicher Freigabe Cloud-Deployment durchführen.
- Bestehende Pi-Version bis zur erfolgreichen Abnahme erhalten.

## 10. Offene Fragen, die der Agent selbst prüfen sollte

- Ist PR #1 gemergt? Was ist der aktuelle Stand von `master`?
- Läuft die App aktuell auf dem Pi, unter welcher URL/Port-Konfiguration und mit welchen Abhängigkeiten? **Keine Zugangsdaten ausgeben.**
- Gibt es inzwischen weitere Cursor-Änderungen oder neue Pull Requests?
- Ist der zweite Cursor-Auftrag (Start/Build/Test) bereits erledigt?
- Wie werden SQLite-Dateien, OSM-Tiles und Hintergrundkarten derzeit wirklich bereitgestellt?
- Welche Umgebungsvariablen und Schlüssel sind für lokale Vorschau, Tests und Cloud-Hosting erforderlich?
- Wie viel RAM/CPU/Speicher benötigt die App realistisch? Reicht ein kleiner VPS?
- Welche Funktionen sind tatsächlich produktiv, welche nur teilweise implementiert?
- Was ist die konkrete Lizenz- und Attributionspflicht für die verwendeten Komponenten und Daten?

## 11. Empfohlener Einstieg für jeden neuen KI-Agenten

> Lies diese Datei vollständig. Untersuche danach den **aktuellen** Zustand von `mandala-wt/openclimbing`. Betrachte das Dokument als Projektkontext und Wunschbild, **nicht** als Beweis für bereits implementierte Funktionen. Erstelle zunächst eine knappe Übersicht: (a) verifiziert vorhanden, (b) noch offen, (c) empfohlener nächster Schritt. Arbeite auf Deutsch. Verändere nichts ohne entsprechenden Auftrag; schütze `master`, die Raspberry-Pi-Installation und sämtliche Zugangsdaten. Entwickle auf dem bestehenden OpenClimbing-Code weiter, statt die Anwendung neu zu schreiben.

## Produktidee (05.11.2026)

Filter für Routen nach Schwierigkeitsgrad und/oder Region würden die Karte übersichtlicher machen.
