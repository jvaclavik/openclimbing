# Kletterglück – Aufgabenübergabe

Status: Änderungen zur Abnahme vorbereitet, offene Punkte unten dokumentiert. Diese Datei ist die gemeinsame Übergabe zwischen Schnellchat und Work-Modus.

## Beschlossene Änderungen

1. **Registrierung und Anmeldung entfernen.** Bestehende Login-/Registrierungsoberflächen und nicht mehr benötigte Authentifizierungslogik nach Prüfung der Abhängigkeiten entfernen. Keine OpenStreetMap-Anmeldung voraussetzen. Bestehende Funktionen und Daten nicht unkontrolliert löschen.
2. **Keine Komoot-Anmeldung oder Freundesynchronisierung.** Keine eigene Community- oder Freundesverwaltung einführen.
3. **Favoriten ohne Konto ermöglichen.** Klettersteige individuell markieren; lokale Speicherung als einfache Lösung prüfen. Einschränkung: Ohne Synchronisierung bleiben Favoriten geräte-/browsergebunden.
4. **Besuchte Klettersteige hervorheben.** Besuchte Steige in Liste/Karte erkennbar machen; zugehörige vorhandene Videos in der Detailansicht schnell abspielbar machen, soweit Dateien/Zuordnungen vorhanden sind.
5. **Schwierigkeitsfilter auf Klettersteige ausrichten.** Normale Sportkletter-/UIAA-/französische Schwierigkeitsfilter aus der Oberfläche entfernen, soweit vorhanden. Stattdessen ausschließlich Klettersteiggrade A bis F als Mehrfachauswahl anbieten, standardmäßig alle aktiv. Kombinierte Grade (z. B. B/C, C/D) nach einer klar dokumentierten Logik berücksichtigen. Unbekannte Grade separat behandeln; nicht willkürlich zuordnen. Filter muss in Karte und Liste konsistent wirken und auf Mobilgeräten gut bedienbar sein.


6. **via-ferrata.de als externe Informationsquelle prüfen.** Für vorhandene Klettersteige passende Detailseiten anhand Name und Lage möglichst zuverlässig zuordnen. Primäres Ziel ist die Anzeige von Tourenbeschreibung, Bewertungen, Erfahrungsberichten, Fotos und aktuellen Hinweisen direkt innerhalb der Kletterglück-Detailansicht, ohne Safari-Wechsel. Zuerst offizielle API, erlaubte Einbettung oder anderweitig ausdrücklich gestattete Datennutzung prüfen. Prüfen, ob Schwierigkeit, Dauer und aggregierte Sternebewertungen rechtlich zulässig und technisch stabil eingebunden werden können. Keine pauschale Übernahme von urheberrechtlich geschützten Beschreibungen, Fotos oder Nutzerrezensionen und kein Massenscraping ohne geklärte Rechte. Bei fehlender API/Freigabe keine fremden Inhalte kopieren oder unzulässig einbetten; die Funktion als blockiert/offen dokumentieren statt externe Links als vollwertige Umsetzung auszugeben. Eine interne Webansicht nur prüfen, wenn technisch möglich und durch Website-Regeln erlaubt. Quellenhinweise sichtbar machen; fremde Daten nicht als eigene ausgeben.

7. **Klettersteig-Routenplaner (neue Idee; Machbarkeit prüfen).** In der Detailansicht Aktion „Tour planen“ vorsehen. Auf der Karte vorhandene, belegte Zustiegs- und Abstiegswege sowie die eigentliche Klettersteigpassage unterscheidbar anzeigen, sofern verlässliche Geodaten vorhanden sind. Strecke, Höhenmeter und geschätzte Dauer nur aus nachvollziehbaren Routendaten ableiten und als Schätzwerte kennzeichnen. Niemals fehlende Wege durch Luftlinien oder frei erfundene Routen ersetzen. Zunächst einen einfachen Tourenüberblick konzipieren; keine Turn-by-turn-Navigation voraussetzen. Vor Implementierung Datenverfügbarkeit, Nutzungsrechte und Aufwand prüfen.

8. **GPX-Export aus der Tourenplanung.** Wenn eine Route auf Basis echter vorhandener Geodaten zusammengestellt wurde, GPX-Datei mit geordnetem Track und ggf. Wegpunkten exportieren. Auf iPhone/iPad Download bzw. Teilen-Menü bereitstellen und einen einfachen Import in Komoot ermöglichen. Keine automatische Komoot-App-Öffnung versprechen: iOS-/Komoot-Importverhalten prüfen und falls nötig kurze Anleitung anbieten. GPX nicht aus bloßen Luftlinien oder unbelegten Wegen erzeugen.
9. **Kartenauswahl vereinfachen.** Bestehende Kartenlayer prüfen und Auswahl auf wenige sinnvolle Typen reduzieren: OpenStreetMap-Standard, eine topografische OSM-basierte Wander-/Höhenlinienkarte und Satellitenansicht. Weitere redundante Kartenansichten aus der Auswahl entfernen, soweit keine Funktion davon abhängt. Nutzungsbedingungen, Attribution und Kachelserver-Limits berücksichtigen; auf Mobilgeräten übersichtliche Umschaltung anbieten.

## Zusätzliche Idee zur Prüfung (nicht beschlossen)

- **Schnellfilter „Für uns passend“**: Optional eine einfache Voreinstellung für bevorzugte Schwierigkeitsgrade, ohne Nutzerkonto. Nur umsetzen, wenn die Oberfläche dadurch wirklich einfacher wird; ansonsten weglassen.


## Spätere Prüfung: privater via-ferrata.de-Prototyp (zurückgestellt)

**Zeitpunkt:** Erst nach Abschluss und Prüfung des derzeit laufenden Work-Auftrags. Dies ist ein Prüfauftrag für später, keine Aufforderung, jetzt parallel mit der Umsetzung zu beginnen.

- Für die ausschließlich private Nutzung von Kletterglück durch zwei Personen einen eng begrenzten Prototyp mit zunächst drei öffentlich erreichbaren Klettersteig-Detailseiten auf via-ferrata.de prüfen.
- Untersuchen, welche Daten technisch zuverlässig zugeordnet und extrahiert werden können (z. B. Name, Lage, Schwierigkeit, Höhenmeter, Dauer, Hinweise). Beschreibungen, Fotos, Rezensionen und Bewertungen gesondert nach Rechten und technischer Machbarkeit beurteilen.
- Eine private Nutzung ist **keine pauschale rechtliche Freigabe** für automatisiertes Auslesen oder Kopieren. Vor Datenübernahme Nutzungsbedingungen, Urheber-/Datenbankrechte, Datenschutz sowie ggf. robots.txt und Zugriffsbeschränkungen prüfen. Keine Login-, Paywall-, CAPTCHA- oder anderen Zugriffsschutzmaßnahmen umgehen; keine massenhafte Extraktion.
- Nur rechtlich zulässige Inhalte innerhalb der Kletterglück-Detailansicht anzeigen; Quelle klar nennen. Ziel bleibt ein In-App-Erlebnis ohne Safari-Wechsel. Bei ungeklärten Rechten lediglich Machbarkeit und offene Punkte dokumentieren, keine fremden Inhalte dauerhaft speichern oder übernehmen.
- Nach dem Prototyp Ergebnisse, Grenzen, Wartungsaufwand und eine Empfehlung zur weiteren Umsetzung vorlegen. Keine produktiven Änderungen ohne gesonderte Freigabe.

## Arbeitsorganisation und Credit-Verbrauch (für alle zukünftigen Work-Aufträge)

- **Aufgaben in kleine, zusammenhängende Pakete aufteilen:** in der Regel 1–3 eng verwandte Aufgaben pro Work-Durchlauf statt die komplette Liste auf einmal. Reihenfolge nach Abhängigkeiten und Nutzen festlegen.
- **Vor Beginn Bestandsabgleich:** aktuellen Standardbranch, bereits gemergte Pull Requests und Aufgabenstatus prüfen; nichts doppelt implementieren.
- **Pro Paket klaren Umfang und Abschlusskriterien definieren:** erst ein Paket umsetzen, passende Tests durchführen und einen PR erstellen; danach Rückmeldung und Freigabe für das nächste Paket abwarten.
- **Credits schonen:** mit angemessenem Denkaufwand/Standardgeschwindigkeit arbeiten, sofern verfügbar; keine unnötigen Wiederholungen, aufwendigen Vollprüfungen oder Endlosschleifen. Bei wiederkehrenden Fehlern nach wenigen gezielten Versuchen stoppen, Ursache und Blocker dokumentieren und Rückfrage stellen.
- **Transparente Übergabe:** pro Paket kurz umgesetzte Änderungen, Testergebnisse, PR-Link, offene Punkte und nächste empfohlene Aufgabe nennen. Keine automatischen Merges, Deployments oder Löschungen produktiver Daten ohne Freigabe.

## Umsetzungshinweise für Work

- Zuerst Repository und vorhandene Authentifizierung, Datenhaltung, Karten- und Videoansichten untersuchen; nicht blind löschen.
- Favoriten und besuchte Steige als getrennte Zustände behandeln.
- Vorhandene Videodateien und Zuordnungen wiederverwenden, keine Videos erfinden.
- Änderungen in einem eigenen Branch und Pull Request vorbereiten; Tests und Mobilansicht prüfen.
- Keine automatische Veröffentlichung oder Löschung produktiver Nutzerdaten ohne gesonderte Freigabe.
- Nach Umsetzung Status und PR-Link hier dokumentieren.

## Stand zur Abnahme

Die Änderungen sind für die öffentliche, kontofreie Kletterglück-Karte vorgesehen. Die bestehende Servervariante mit eigener Benutzerdatenbank behält ihre Anmeldung und die geschützten OSM-/Wikimedia-Bearbeitungs- und Datenfunktionen. Die lokalen Listen behalten ihre bestehenden Speicherbereiche und Einträge.

| Punkt | Stand |
| --- | --- |
| Kontofreie Karte | Konto-Einstiege, Community-Links und von Anmeldung abhängige Bearbeitungsaktionen aus der öffentlichen Kartenoberfläche entfernt. Kontobezogene Serverpfade bleiben für die getrennte Betriebsvariante bestehen. |
| Favoriten und Besuche | Bestehende lokale Favoriten und eigene Listen weiterverwendet. Besuchsstatus bleibt getrennt. Besuchte Steige haben weiterhin Kartenmarkierungen und erscheinen auch in der Klettersteigliste mit Haken. |
| Videos | Direkt in den Details der fünf eindeutig per OSM-ID zugeordneten Steige. Bestehende ortsbasierte Clips bleiben verfügbar. Ohne gesicherte Objekt-ID gibt es keinen zusätzlichen Detailknopf. |
| A–F-Filter | Mehrfachauswahl mit A–F und Unbekannt, alles anfangs aktiv. B/C passt zu B oder C. Bereiche enthalten die Zwischenstufen. OSM-Werte 1–6 werden A–F zugeordnet, Zusätze +/− ändern die Grundstufe nicht. 0, fehlende und nicht unterstützte Werte bleiben unbekannt. Karte und Entdeckungsliste nutzen denselben Katalog und dieselbe Filterregel. Kartenobjekte ohne Katalogeintrag gelten als unbekannt. Persönliche Listenmarkierungen bleiben eine eigene Ebene. |
| Kartenauswahl | OpenStreetMap, die vorhandene topografische Karte und die vorhandene MapTiler-Satellitenansicht. Vorhandene eigene Karten und Funktions-Overlays bleiben verfügbar. Alte eingebaute Basiskarten wechseln zur topografischen Karte. Die OSM-Standardkarte verwendet den offiziellen Kachel-Endpunkt mit Attribution. |
| via-ferrata.de | Offen. Keine dokumentierte öffentliche API oder ausdrückliche Erlaubnis für Beschreibung, Fotos, Erfahrungsberichte oder Bewertungen gefunden. Die geprüfte Seite antwortet mit `X-Frame-Options: SAMEORIGIN`. Eine ausdrückliche Freigabe des Betreibers und eine stabile Schnittstelle fehlen. |
| Tourenplaner und GPX | Offen. Die vorhandene Klettersteiggeometrie belegt nicht automatisch Zustieg und Abstieg. Beim Norissteig ist das zugeordnete OSM-Objekt ein kurzes Steigstück. Für einen ersten Pilotsteig werden drei belegte, zusammenhängende Abschnitte und für Höhenmeter eine geeignete Höhenquelle benötigt. Erst danach kann daraus ein Track erzeugt werden. |

Quellen zur Prüfung

- [via-ferrata.de – Nutzungsbedingungen](https://www.via-ferrata.de/nutzungsbedingungen/)
- [OpenStreetMap – Regeln für Standardkartenkacheln](https://operations.osmfoundation.org/policies/tiles/)
- [OpenStreetMap – Norissteig, Brettl](https://www.openstreetmap.org/way/1156787758)
- [Komoot – GPX-Import](https://support.komoot.com/hc/de/articles/10115477099674-Routen-und-Touren-exportieren-und-importieren)

Pull Request zur Abnahme: [#17](https://github.com/mandala-wt/openclimbing/pull/17).

Prüfung: 42 gezielte Tests bestanden. Mobilansichten in Chromium für iPhone 13 und iPad Mini geprüft. Der Gesamtlauf hatte dieselben 43 Fehler wie der unveränderte Vergleichsstand. Der vollständige Produktionsbuild ist noch offen.
