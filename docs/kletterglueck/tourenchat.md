# Tourenchat (Vorschau)

Der Kartenknopf **Tourenchat** öffnet einen deutschsprachigen KI-Chat. GPT-4.1 mini
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
  Schließen/erneut öffnen erhält ihn; Neuladen oder „Neuer Chat“ löscht ihn
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

`yarn jest src/server/chat/__tests__/chat.test.ts --runInBand` prüft Validierung,
Vorschau- und Origin-Schutz, Drosselung, echte Quellenlinks, Gesprächskontext,
Datenminimierung und bereinigte Fehler. Zusätzlich in der PR-Vorschau den Chat
öffnen, Region anfragen, Folgefrage stellen und einen Kartenlink prüfen.
