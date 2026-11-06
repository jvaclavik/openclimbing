# Übergabe an die nächste KI – Stand 06.11.2026, 9:45 Uhr (Berlin)

Kurzfassung für den direkten Einstieg. Ausführlicher Hintergrund: `docs/project/PROJECT_CONTEXT_OpenClimbing.md` und `docs/project/brainstorming.md`.

## 1. Worum es geht

- Eigene deutschsprachige Klettersteig-Web-App auf Basis von OpenClimbing/OsmAPP. Name bisher „Klettersteig-Karte“, Favorit für den neuen Namen: **„Kletterglück“**.
- Repository: https://github.com/mandala-wt/openclimbing (öffentlich, Branch `master`)
- Live: https://klettersteig-karte.vercel.app – jeder Merge auf `master` geht nach ein paar Minuten automatisch live (Vercel).
- Technik: Next.js 15 (Pages Router), React 19, MUI, MapLibre. Tests mit `yarn test` (Jest), Lint mit `yarn lint`.

## 2. So arbeitet der Nutzer

- Arbeitet nur mit **iPhone und iPad**, kein Laptop. Will kein Terminal, kurze klare Antworten auf **Deutsch**, ohne Fachjargon.
- Spricht oft per Spracheingabe. Wörter sind dann manchmal falsch erkannt („Zähne“ = Szene, „CAD“ = Cut, „Verrat Patrone“ = Ferrata Burrone).
- Arbeitsweise: Die KI erstellt einen Branch und einen PR, **der Nutzer führt den PR selbst auf GitHub zusammen**. Danach ist die Änderung live.
- Downloads: Datei-Anhänge aus dem Cursor-Chat konnte er nicht öffnen. **GitHub-Links funktionieren** (am besten `raw`-Links).
- Im Chat lassen sich nur Dateien **bis 15 MB** hochladen. Größere Videos kommen per WeTransfer-Link.
- Er möchte Schritt für Schritt vorgehen, **nicht alles auf einmal**.

## 3. Verstecktes Musikvideo-Easter-Egg auf der Karte (aktuelles Hauptthema)

Idee: Nur für die eigene Klettergruppe. Wer auf einem bestimmten Klettersteig nah genug heranzoomt, sieht oben rechts ein kleines Hochformat-Video mit Ton, eine kurze Szene aus einem KI-animierten Musikvideo der Gruppe. Es gibt keinen Menüpunkt dafür.

### Code

- `src/components/Map/HiddenFerrataClip/matchHiddenFerrataClip.ts` – Liste der Orte (`SPOTS`) und die Grenzwerte
- `src/components/Map/HiddenFerrataClip/HiddenFerrataClip.tsx` – der Player
- `src/components/Map/HiddenFerrataClip/__tests__/matchHiddenFerrataClip.test.ts` – Tests
- Videos für die Karte liegen in `public/versteckt/<id>.mp4`

### Verhalten (vom Nutzer so gewünscht)

- Erscheint ab **Zoomstufe 14**, wenn die Kartenmitte höchstens **700 m** vom Steig entfernt ist. Zoom 13 und 1 km waren ihm zu früh.
- **Startet von selbst.** Das iPhone erlaubt ohne Antippen keinen Ton, deshalb startet das Video notfalls stumm. Der Ton geht beim nächsten echten Tipp auf die Karte an (`touchend`/`click`).
  - Wichtig: Den Ton **nicht** bei `pointerdown`/`touchstart` einschalten, sonst hält iOS das Video an. Das war gestern der Fehler „Video läuft kurz und bleibt stehen“.
  - Hält das System das Video an, läuft es stumm weiter. Stoppen dürfen es nur das Ende des 2. Durchlaufs und das Kreuz.
- Läuft **zweimal**, pausiert dann und **schließt sich selbst**. Wer die Stelle verlässt und wiederkommt, sieht es erneut.
- Im iPhone-Stromsparmodus starten Videos grundsätzlich nicht von selbst. Dagegen lässt sich nichts machen.

### Schon live (geprüft am 06.11. morgens)

| id            | Ort                                                          | Koordinaten            | Datei                                                                        |
| ------------- | ------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------- |
| `lenzsteig`   | Lenzsteig, Karlstadt (OSM way 42213444)                      | 49.9913425, 9.7612947  | `public/versteckt/lenzsteig.mp4`                                             |
| `tegelberg`   | Tegelbergsteig (OSM way 84013032)                            | 47.5626131, 10.7747456 | `public/versteckt/tegelberg.mp4`                                             |
| `mezzocorona` | Ferrata Burrone Giovannelli, Mezzocorona (OSM way 219231582) | 46.2304381, 11.0987999 | `public/versteckt/mezzocorona.mp4` (= `video-schnipsel/04_klettersteig.mp4`) |

Testlinks: `https://klettersteig-karte.vercel.app/#16/49.9913/9.7613`, `#16/47.5626/10.7747`, `#15/46.2304/11.0988`

### Als Nächstes dran (Reihenfolge vom Nutzer, einer nach dem anderen)

Die Ortsliste stammt vom Nutzer, die Koordinaten wurden über OSM/Nominatim gesucht. Die Clips liegen in `video-schnipsel/`:

1. **Riva del Garda** – `05_see.mp4` – 45.8847708, 10.8396942 (Ortsmitte; einen konkreten Klettersteig hat der Nutzer nicht genannt, ggf. nachfragen)
2. **Norissteig** – `06_selfie_wald.mp4` – 49.5441152, 11.5306697 (OSM way 1156787758)
3. **Laber, Oberammergau** – `08_schnee.mp4` – 47.5858442, 11.1021690 (Gipfel, OSM node 452941377)
4. **Laberbahnhütte** – `11_huette.mp4` – 47.5861767, 11.1029747 (Bergstation Laber-Bergbahn, OSM way 51038810). Achtung: liegt nur ~70 m vom Laber-Gipfel entfernt. Zwei Spots so dicht beieinander gehen nicht gut, der nähere gewinnt. Lösung mit dem Nutzer klären, z. B. abwechselnd abspielen oder nur einen Clip nehmen.
5. **Stopselzieher, Zugspitze** – `09_gletscher.mp4` – 47.4225221, 10.9729653 (OSM way 37293628)
6. **Lenzsteig, Waldweg** – `12_waldweg.mp4` – liegt am selben Ort wie der bestehende Spot `lenzsteig`. Nicht als eigener Spot möglich, mit dem Nutzer klären (z. B. abwechselnd mit dem bestehenden Clip).

Offen:

- Für Mezzo Corona gibt es noch zwei weitere Clips: `03_felsen.mp4` und `07_leiter.mp4`. Bisher wird nur Clip 04 gezeigt.
- Für `10_grat.mp4` und `13_wald_paar.mp4` kennt der Nutzer den Ort noch nicht.

### Einen neuen Spot einbauen

1. Clip nach `public/versteckt/<id>.mp4` kopieren (H.264 + AAC, `faststart`, unter 15 MB; die Clips in `video-schnipsel/` erfüllen das).
2. In `matchHiddenFerrataClip.ts` die `id` zum Typ hinzufügen und einen Eintrag in `SPOTS` anlegen (Kommentar mit Steigname und OSM-ID).
3. Einen Test in `matchHiddenFerrataClip.test.ts` ergänzen, dann `yarn test src/components/Map/HiddenFerrataClip`.
4. Branch, PR, kurz auf Deutsch erklären, Testlink mitschicken. Der Nutzer führt den PR zusammen.

Testen: Die Vercel-Vorschau ist durch einen Vercel-Login geschützt (Antwort 302). Lokal mit `yarn dev` und Headless-Chrome (`/usr/local/bin/google-chrome`, puppeteer-core) mit `--autoplay-policy=document-user-activation-required` funktioniert es gut.

## 4. Videomaterial im Repo

- `video-schnipsel/01_…13_*.mp4` – 13 Clips aus einem 67-s-Video (Dreamina/KI, Hochformat). Ortszuordnung und Inhalt stehen in `video-schnipsel/Schnittliste.txt`. Dazu `schnipsel-1.zip` und `schnipsel-2.zip` mit denselben Clips.
- `video-schnipsel/klettersteig-musikvideo/` – 37 Szenen aus dem ganzen Musikvideo (ca. 4 Minuten), automatisch an Szenenwechseln geschnitten, mit `INDEX.md` und `cuts.json`. **Noch keinem Ort zugeordnet.**
- Hinweis: Das Repository ist öffentlich, die Videos sind also für jeden sichtbar. Der Nutzer wollte sie bewusst auf GitHub haben. Der Ordner ist rund 440 MB groß. Die beiden Zips (60 + 47 MB) sind doppelt und könnten später entfernt werden, aber nur nach Rückfrage.

### Regeln, wenn der Nutzer ein Video zum Schneiden schickt

- Nur schneiden: Inhalt, Ton, Reihenfolge und Look bleiben. Keine Effekte.
- An jedem echten Szenenwechsel schneiden, Clips etwa 5–10 s. Kurze Einstellungen bleiben kurz, nichts zusammenkleben.
- Weiße und rote KI-Übergangsblitze zwischen den Szenen weglassen.
- Jede Datei unter 15 MB. Bewährt: `ffmpeg -ss START -to ENDE -i quelle -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart` (`-ss`/`-to` vor `-i` ist bildgenau).
- Anfang und Ende jedes Clips als Einzelbild prüfen. Für das letzte Bild `-vf reverse -frames:v 1` nehmen, `-ss` kurz vor dem Ende trifft nicht genau.
- Abgabe: einzelne MP4s plus Schnittliste, per GitHub-Link.

## 5. Weitere offene Ideen (nicht ungefragt anfangen)

- **iPhone-Ränder (Notch/Home-Leiste):** Als Home-Bildschirm-App ist `apple-mobile-web-app-status-bar-style` auf `black-translucent` gesetzt, im Viewport fehlt aber `viewport-fit=cover` (`pages/_app.tsx`). Dadurch kann die Suchleiste unter die Uhrzeit rutschen. Empfehlung: `viewport-fit=cover` ergänzen und nur die Bedienelemente (TopBar oben, Menü und Knöpfe unten) mit `env(safe-area-inset-*)` einrücken. **Nicht** `body` padden, sonst ist die Karte nicht mehr randlos. Vorbild im Code: `src/components/FeaturePanel/FeatureImages/PhotoLightbox.tsx`. Der Nutzer hat das angesprochen, aber noch nicht freigegeben.
- **Kontrastmodus** für Sonne am Berg (kräftigere Linien, dunklere Schrift, evtl. automatisch bei `prefers-contrast: more`). Die Bildschirmhelligkeit kann eine Web-App nicht steuern.
- Aus `brainstorming.md`: Routenfilter (Grad/Region) ins Klettersteig-Menü integrieren, Bildergalerie pro Steig, Beschreibungen, Topos, persönliches Kletter-Log mit Smileys auf der Karte, Umbenennung in „Kletterglück“.

## 6. Nicht anfassen ohne Rückfrage

- Raspberry-Pi-Installation (Rückfalllösung)
- Secrets/Schlüssel (die in `.env` gehören dem Originalprojekt) – nie ausgeben
- Keine kostenpflichtigen Aktionen, keine Domain-Käufe
- `npx tsc --noEmit` meldet schon länger einige Typfehler in fremden Dateien (fehlende SVG-Typen, alte Tests). Die stammen nicht von den Clip-Änderungen.
