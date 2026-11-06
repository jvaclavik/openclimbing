# Kletterglück – Aufgabenübergabe

Status: PR #17 ist in `master` zusammengeführt. Abgleich vom 06.11.2026 mit `master` bei Commit `d69d536`. Diese Datei ist die gemeinsame Übergabe zwischen Schnellchat und Work-Modus.

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


## Privater via-ferrata.de-Prototyp (beauftragt)

**Aktualisierung:** Simon möchte den begrenzten Prototyp für sich und seine Mutter jetzt in die Planung aufnehmen. Vor einer produktiven Übernahme bleiben Rechte, Zugriffsschutz und technische Machbarkeit zu klären.

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

## Umsetzungsstand auf dem Standardbranch

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

Vorheriger Pull Request: [#17](https://github.com/mandala-wt/openclimbing/pull/17), zusammengeführt.

Prüfung: 42 gezielte Tests bestanden. Mobilansichten in Chromium für iPhone 13 und iPad Mini geprüft. Der Gesamtlauf hatte dieselben 43 Fehler wie der unveränderte Vergleichsstand. Der vollständige Produktionsbuild ist noch offen.

## Abgleich und nächste Schritte (06.11.2026)

- **Umgesetzt:** öffentliche Karte ohne Konto-Einstiege; lokale Favoriten, Listen und Besuche; Videos für fünf zugeordnete Steige; A–F-Filter; drei eingebaute Grundkarten. Die separate Servervariante mit Authentifizierung und ihre Daten bleiben bestehen. Keine Community oder Komoot-Anmeldung ergänzen.
- **Karten:** Der öffentliche Layer-Schalter enthält OpenStreetMap, Topografisch und Satellit; eigene Karten und Überlagerungen bleiben verfügbar. Die topografische Darstellung nutzt den vorhandenen Tourist-Stil mit Höhenlinien und Relief; Satellit und topografischer Stil verwenden MapTiler. Für deren Betrieb bleiben gültiger Schlüssel, Vertrag, Attribution und Kontingent zu prüfen. Für die OSM-Standardkacheln gelten sichtbare Attribution, reguläre Browser-Referer- und Cache-Nutzung sowie kein Offline-Vorladen. Die tatsächliche Netzwerkkonfiguration und Limits der produktiven Installation wurden hier nicht erneut geprüft.
- **Routenplaner: offen / durch Datenlage blockiert.** Ein OSM-Klettersteigobjekt oder eine Relation beweist nicht automatisch einen vollständigen Zu- und Abstieg oder eine eindeutige Richtung. Ein Pilot benötigt eine nach Quelle und Stand dokumentierte Route mit belegtem Start und Ziel sowie geordneten, tatsächlich verbundenen Abschnitten für Zustieg, Klettersteig und Abstieg. Varianten, Richtung, Zugang und Aktualität müssen geprüft werden. Nicht verbundene oder unklare Abschnitte dürfen nicht durch Luftlinien ergänzt werden. Die vorherige Prüfung zum Norissteig reicht hierfür nicht aus; in diesem Abgleich wurde kein weiterer vollständiger Pilot verifiziert.
- **GPX: blockiert durch fehlende Pilotroute.** Erst nach Prüfung der Route einen geordneten Track mit Quellennachweis erstellen; Entfernung und ggf. Höhenmeter und Dauer nur bei geeigneter Datenbasis als Schätzung ausweisen. Vor Freigabe GPX-Datei auf iPhone/iPad speichern bzw. teilen und den Import in Komoot praktisch testen; Komoot dokumentiert den GPX-Import, aber ein automatisches Öffnen ist nicht zugesagt.
- **via-ferrata.de: offen.** Keine Inhalte oder Einbettung ohne geklärte Rechte und technische Freigabe übernehmen. Der begrenzte private Prototyp ist wieder beauftragt; Rechte und Zugriffsschutz sind vor einer produktiven Datenübernahme zu klären.
- **„Für uns passend“: nur Idee zur späteren Prüfung**, nicht beschlossen und nicht implementiert.

### Quellen und technische Voraussetzungen

- [OSMF-Kachelrichtlinie](https://operations.osmfoundation.org/policies/tiles/) und [OSM-Lizenz- und Quellenhinweise](https://osmfoundation.org/wiki/Attribution_Guidelines): Daten und Kacheldienst haben unterschiedliche Nutzungsbedingungen; Datenherkunft und Lizenz bei einer späteren Route sichtbar dokumentieren.
- [OSM-Wiki: Klettersteigrelation](https://wiki.openstreetmap.org/wiki/Tag:route%3Dvia_ferrata): Anfang und Richtung sind aus einer Relation nicht immer zuverlässig ableitbar.
- [Komoot: Routen importieren](https://support.komoot.com/hc/de/articles/10115477099674-Routen-und-Touren-exportieren-und-importieren): GPX-Import ist dokumentiert; tatsächlichen iOS-Ablauf mit einer validierten Beispieldatei prüfen.
- [via-ferrata.de: Nutzungsbedingungen](https://www.via-ferrata.de/nutzungsbedingungen/): keine Freigabe zur Übernahme von Beschreibungen, Bildern oder Bewertungen festgestellt.

Dieser Abgleich aktualisiert ausschließlich die Dokumentation. Es wurden keine App-Funktionen geändert; ein neuer mobiler Funktionstest und ein Produktionsbuild wurden in diesem Schritt nicht durchgeführt. Die oben genannten 42 Tests und Mobilprüfungen stammen aus PR #17.

### Pilotprüfung Norissteig

Die [DAV-Sektion Noris beschreibt den Norissteig und eine Rundtour ab Hirschbach](https://www.dav-noris.de/klettersteige/norissteig): Zustieg über den gelb markierten Weg Richtung Fischbrunn, anschließend der rot markierte Norissteig zurück nach Hirschbach. Dies ist eine geeignete fachliche Referenz für einen Pilot, aber die Beschreibung allein liefert noch keinen nachprüfbar geordneten GPX-Track mit eindeutig verbundenen OSM-Objekten. Varianten und die genauen Übergänge müssen gesondert identifiziert und geprüft werden. Die DAV weist zudem auf [Ausrüstung und Eigenverantwortung](https://www.dav-noris.de/Klettersteige/sicherheitshinweis-zur-nutzung-von-klettersteigen) hin. Bis zur Prüfung bleibt die Umsetzung blockiert; keine Übernahme fremder Tourentexte oder Tracks.

### Aktueller Stand zum privaten Prototyp

Die private Nutzung für zwei Personen ist gewünscht, begründet aber allein noch keine allgemeine Freigabe für automatisierte Übernahme und Anzeige fremder Inhalte. Die öffentlich gefundenen Nutzungsbedingungen betreffen insbesondere das Board; sie enthalten nach Prüfung keine eindeutige Aussage zur hier geplanten automatisierten Nutzung. Daraus folgt weder ein allgemeines Verbot noch eine Erlaubnis. Für konkrete Daten und Darstellungsarten Nutzungsrechte und eine geeignete Schnittstelle beim Betreiber klären. Die bestehende Vercel-Adresse ist öffentlich erreichbar; der Schutz der privaten Anwendung für zwei Personen muss vor einer privaten Bereitstellung technisch überprüft werden. Keine Anfrage an den Betreiber ohne Simons ausdrücklichen Auftrag absenden.

### Offline-Techniktest

Unter `experiments/private-tour-metadata/` liegt ein kleiner, vom Webbetrieb getrennter Parser für bereits bereitgestelltes HTML mit JSON-LD-Tourdaten. Er führt keine Netzwerkanfragen aus, speichert nichts und übernimmt keine Texte, Fotos oder Bewertungen. Sechs synthetische Testfälle prüfen eindeutige und fehlende Daten, ungültiges JSON und Koordinaten. Ausgeführt mit Node und der im Arbeitsverzeichnis vorhandenen transitive Testabhängigkeit `jsdom`. Drei öffentlich erreichbare Tourseiten wurden anschließend auf ihre Struktur geprüft; eine Nutzungserlaubnis ist damit nicht nachgewiesen; kein Scraper, keine App-Integration und keine private Zugriffssicherung sind fertig. Vor echter Nutzung: Rechte und Quellformat prüfen, direkte Testabhängigkeit sauber festlegen und privaten Zugriff testen.

### Prüfung echter Seiten und Zugriff (06.11.2026)

Die öffentlichen Detailseiten Lenzsteig, Norissteig und Stopselzieher antworteten bei einmaliger Browserprüfung mit HTTP 200. Alle drei bieten JSON-LD vom Typ `Trip` mit Feldern für Name, Beschreibung, Anforderungen, Dauer und eine Reiseroute; unmittelbare `geo`-Felder waren dort nicht vorhanden. Der Offline-Parser erkennt nun auch `Trip`, wurde aber weiterhin nur mit künstlichen Daten getestet. Die Prüfung hat keine Nutzungsfreigabe ergeben. Die robots.txt war erreichbar und schränkt unter anderem automatisierte Zugriffe auf bestimmte Foto- und Bewertungs-Pfade ein; sie ist keine Inhaltslizenz. Keine Inhalte in das Projekt übernommen.

Vercel-Projekt `klettersteig-karte` gefunden. Nach Freigabe wurden die Einstellungen gelesen: Vercel-Authentifizierung ist für `all_except_custom_domains` eingeschaltet, Passwortschutz ist ausgeschaltet. Das beweist keinen Schutz der produktiven Kartenadresse; diese muss für die private Nutzung explizit geprüft werden. Der Tarif ist noch nicht verifiziert. Vercel bietet Schutzoptionen je nach Tarif; vor Änderung ist zu klären, wie beide Personen Zugang erhalten. Keine Änderungen am Live-System durchgeführt.

Vercel dokumentiert die Möglichkeit, mit Vercel Authentication berechtigten Personen Zugriff zu geben; im Hobby-Tarif ist ein externer Nutzer möglich. Ein Link allein kann weitergegeben werden und ist kein persönlicher Identitätsnachweis. Als Alternative kommt der private Zugriff über den bereits vorhandenen Raspberry Pi und Tailscale infrage; für beide Personen müssten Gerätezugriff und Erreichbarkeit eingerichtet und getestet werden. Vor Umstellung der bestehenden produktiven Karte die gewünschte Zugangsart festlegen und den Login für beide Personen prüfen; keine automatische Änderung oder Veröffentlichung. Quellen: [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication), [Freigabelinks](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links).

**Zugangswunsch:** Simon möchte mit seiner Mutter einen gemeinsamen Zugang ohne zusätzliches Konto für sie. Vercel-Freigabelinks funktionieren laut Anbieter ohne Konto und sind widerrufbar; sie sind wie ein Schlüssel weitergebbar. Hobby erlaubt einen Freigabelink pro Konto. Vercel-Passwortschutz ist im Hobby-Tarif nicht verfügbar und auf Pro laut Anbieter kostenpflichtig. Tarif und Schutz der Produktionsdomain sind noch nicht abschließend bestätigt. Keine Umstellung der produktiven Karte im Rahmen dieses PRs; vor einer Freigabe Links, Schutz aller relevanten Domains und Zugang auf beiden Geräten testen. [Vercel: Freigabelinks](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links), [Vercel: Passwortschutz und Kosten](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection).

**Zugang umgesetzt (06.11.2026):** Vercel Authentication schützt jetzt alle Deployments des Projekts einschließlich der Produktionsdomain. Der gemeinsame Freigabelink für den Pilot ist bis 06.12.2026 gültig. Getestet: Die reguläre Kartenadresse und drei zugehörige Vercel-Adressen leiten ohne Freigabe zur Anmeldung weiter. Nach Öffnen des Freigabelinks lädt die Karte in einer Sitzung ohne Vercel-Anmeldung. Der Schlüssel wird nicht im Repository hinterlegt. Die Rechteklärung für die Tourdaten ist davon unabhängig.

### Norissteig: kartierte Pilotrunde (06.11.2026)

Der [GPX-Track](project/norissteig-osm-variante.gpx) folgt dem gelben Balken vom Hirschbacher Dorfplatz zur Abzweigung Richtung Fischbrunn und der roten Norissteig-Relation zurück nach Hirschbach. Der DAV beschreibt diese Runde als Variante ab Hirschbach. Daten: [OSM-Relation 163020](https://www.openstreetmap.org/relation/163020) und [OSM-Relation 949200](https://www.openstreetmap.org/relation/949200), © OpenStreetMap contributors ([ODbL 1.0](https://www.openstreetmap.org/copyright)).

- Zustieg: 1,91 km. OSM-Ways in Reihenfolge: 146166036, 55985564, 25292173, 42127331, 25290980, 34648816, 35376491, 1160278691, 36779843, 36779898, 36780591, 36779907, 636366047, 636366046, 1205585420, 36779911, 36779913, 36779916, 35330169, 1156631406.
- Norissteig mit gesicherten Passagen und Gehgelände: 3,02 km. OSM-Ways: 35330171, 1417602578, 1156631407, 1417602577, 35330157, 34649065, 34649067, 981923288, 981923287, 981923282, 981923281, 179325226, 981923291, 981923293, 981923290, 981923289, 179325225, 179325223, 1156631416, 1156631417, 35376463, 35376465, 1178301285, 34649064, 179490330, 1156787761, 179490331, 1278085469, 1278085470, 1156787759, 229012138, 36782839, 36782560, 36782558, 36782555, 34655891, 36861895, 1156787767, 1156787768, 38324105, 229041613, 24780307, 35376471, 229012137, 25292344, 1158415124, 25292176, 1158415131, 34649074, 586029588, 586029586.
- Rückweg nach der letzten als Klettersteig markierten Passage: 0,91 km. OSM-Ways: 36780636, 1160278700, 1160278692, 1160278693, 34649081, 1160278695, 34649083, 1160278691, 35376491, 34648816, 25290980, 42127331, 25292173, 55985564, 146166036.

Alle Wege sind an identischen OSM-Knoten verbunden. Start und Ende sind am Dorfplatz identisch. GPX-XML geprüft: 3 Abschnitte, 476 Punkte einschließlich der gemeinsamen Abschnittsgrenzen, 5,85 km aus der zweidimensionalen Geometrie. Kein Vor-Ort-Abgleich oder Komoot-Importtest durchgeführt. Keine Höhenmeter oder Zeit aus dem Track berechnet.

Die OSM-Relation führt am Brettl über die kartierte Wegvariante und enthält die gesicherte Querung (Way 1156787758) nicht. Die GPX-Datei ist entsprechend benannt. Für eine Variante über das Brettl ist der durchgehende Anschluss der Querung gesondert zu belegen. Tourenansicht und GPX-Schaltfläche sind noch nicht eingebaut.

### via-ferrata.de: Stand der Freigabe (06.11.2026)

Das [Impressum](https://www.via-ferrata.de/impressum/) erlaubt persönliche, private und nichtkommerzielle Kopien und Downloads. Eine Einbettung in fremde Frames verlangt schriftliche Erlaubnis. Eine ausdrückliche Erlaubnis für automatisierten Abruf, Speicherung auf einem Server und Anzeige in der gemeinsam genutzten App ist daraus nicht ersichtlich. Die [Nutzungsbedingungen](https://www.via-ferrata.de/nutzungsbedingungen/) räumen dem Betreiber Nutzungsrechte an Nutzerbeiträgen im Rahmen des Boards ein. Texte, Fotos und Rezensionen deshalb getrennt von sachlichen Metadaten behandeln. Für den Pilot beim [Betreiber](https://www.via-ferrata.de/kontakt/) nach einer Schnittstelle und schriftlicher Zustimmung für drei ausgewählte Seiten fragen, einschließlich zulässiger Felder, Abrufhäufigkeit, Zwischenspeicherung und Quellenangabe. Bislang wurde keine Anfrage abgesendet und kein Inhalt übernommen.
