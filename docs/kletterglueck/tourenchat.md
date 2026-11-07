# Tourenchat (Vorschau)

Am Kartenrand liegt ein kleiner Hinweis **Tourenhilfe**. Erst ein Tipp öffnet ein
kompaktes, nicht modales Feld mit Eingabe und kurzen Startfragen. Die Karte bleibt
bedienbar: kein Abdunkeln, keine Fokusfalle, kein Vollbild. Minimieren zeigt wieder
nur den Hinweis; der Verlauf bleibt in diesem Feld erhalten, **Neuer Chat** löscht
ihn. Die Hilfe öffnet sich nicht von selbst und schreibt nichts, wenn die Karte
bewegt wird.

Ein Standort wird nicht aus der Kartenansicht abgeleitet. Nur die Startfrage
„Leichte Touren hier finden“ hängt den Namen einer bereits geöffneten Tour oder
eines Ortes an, sofern ein Name vorliegt. Koordinaten werden nicht mitgeschickt.

GPT-4.1 mini
(OpenAI) wird serverseitig über Vercel AI Gateway aufgerufen. Auf Vercel verwendet
das AI SDK die OIDC-Identität des Projekts: kein Schlüssel im Browser oder Repository.
Eine vorhandene `AI_GATEWAY_API_KEY`-Variable hätte Vorrang vor OIDC; sie ist für
diese Implementierung nicht erforderlich und sollte für Projektbudget-Zuordnung
nicht gesetzt sein.

Bewusst nur in `VERCEL_ENV=preview` sichtbar und erreichbar. Keine automatische
Freischaltung für Produktion. Lokale API-Tests mocken KI und Datenquellen; zum
lokalen manuellen Test wäre zusätzlich eine eigene Gateway-Authentifizierung nötig.

## Daten und Grenzen

- Werkzeug `searchTours`: Namen, Stadt und ISO-Ländercode im öffentlichen
  OpenStreetMap-Klettersteig-Katalog, den die Karte bereits nutzt.
- Optional Metadaten der ersten 200 zentral gespeicherten Touren mit gültigem
  OSM-Verweis, sofern der bestehende Supabase-Tourenspeicher in der Vorschau
  konfiguriert ist. Quellenfehler werden im Chat angezeigt.
- Nur serverseitige Daten bestimmen die Kartenlinks. Werkzeugergebnisse sind
  Suchtreffer, nicht automatisch eine Rangliste oder bestätigte Empfehlung.
- Keine allgemeine Websuche oder Geocodierung. Eine Region muss im Tourennamen
  oder Ort vorkommen. Keine aktuellen Sperrungen/Wetterdaten und keine
  detaillierten Wegbeschreibungen; fehlende Angaben soll das Modell benennen.
- Nachrichten und ausgewählte Metadaten werden an Gateway/Modellanbieter
  übertragen. Keine Familiennotizen, Bewertungen, Profile oder GPX-Tracks.
  Der Browser speichert den Verlauf nur im React-Zustand, nicht dauerhaft.
  Minimieren und erneut öffnen erhält ihn; Neuladen oder „Neuer Chat“ löscht ihn
  im Browser, nicht etwaige Logs bei Gateway/Anbieter.

## Kosten und Schutz

KI-Anfragen verursachen nutzungsabhängige Kosten. Ein Projektbudget sollte vor
dem Test gesetzt sein; kein automatischer Guthabenkauf durch die Anwendung.
Das Budget ist die gemeinsame Gateway-Kostengrenze (keine atomare Cent-genaue
Sperre bei parallelen Anfragen). Das instanzlokale Limit von sechs Anfragen pro
Minute/IP ist nur zusätzliche Entlastung, kein verteilter Missbrauchsschutz.
Ein öffentliches Produktionsangebot braucht vor Freischaltung eine eigene
Zugangskontrolle und dauerhaftes Rate-Limiting.

Jede Anfrage erlaubt maximal 12 alternierende Nachrichten mit je 2000 Zeichen,
32 KB Request-Body, drei Modellschritte, 700 Ausgabetoken pro Schritt und
35 Sekunden Modelllaufzeit. Es werden höchstens fünf vorherige Austauschpaare
mitgesendet. Keine Systemrollen/Werkzeugaufrufe vom Browser akzeptiert.

## Prüfung

`yarn jest src/server/chat/__tests__/chat.test.ts src/components/TourChat --runInBand`
prüft Validierung, Vorschau- und Origin-Schutz, Drosselung, echte Quellenlinks,
Gesprächskontext, Datenminimierung, bereinigte Fehler und das nicht modale Feld
(zunächst eingeklappt, Vorschläge erst nach dem Tipp, Verlauf beim Minimieren,
Karte nicht blockiert). Zusätzlich in der PR-Vorschau die Tourenhilfe öffnen,
die Karte dabei verschieben, Region anfragen, Folgefrage stellen und einen
Kartenlink prüfen.
