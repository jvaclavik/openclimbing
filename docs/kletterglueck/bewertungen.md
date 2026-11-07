# Gemeinsame Familienbewertungen

Die Oberfläche unter `/kletterglueck-bewertungen` nutzt dieselbe Supabase-Datenbank und dieselben Touren-UUIDs wie der zentrale Katalog. Darüber stehen die Besucherbewertungen des Norissteigs von via-ferrata.de. Die App liest sie bei Bedarf, speichert sie nicht im Repository und zeigt Fotos nicht an. Quelle und Link bleiben sichtbar. Die Karte bietet den Einstieg über den Stern-Knopf, am Norissteig zusätzlich über **via-ferrata-Bewertungen**, bestehende Klettersteigdetails über **Unsere Bewertungen**, gespeicherte Touren zusätzlich über ihr Startpunkt-Popup.

Die zentrale Datenhaltung aus PR #22 muss eingerichtet sein. Anschließend [ratings.sql](ratings.sql) einmal im SQL Editor desselben Supabase-Projekts ausführen. Einträge für Simon und Mama sind durch den zusammengesetzten Primärschlüssel aus Tour-ID und Profil eindeutig. Bewertet werden ausschließlich bereits zentral gespeicherte Touren. Die Oberfläche kann die Touren suchen und in Seiten zu 50 Einträgen laden. Notizen sind auf 2.000 Zeichen beschränkt. Sterne ohne Begehung und Begehung ohne Sterne sind möglich. Der Durchschnitt enthält nur tatsächlich vergebene Sterne.

Lesen und Schreiben liegen hinter dem bereits bestehenden Vercel-Schutz **All Deployments**. Schreibzugriffe prüfen außerdem den Origin-Header. Supabase-Browserrollen haben keine Tabellenrechte. Die beiden Familienprofile sind eine Auswahl innerhalb des gemeinsamen Zugangs. Jeder mit diesem Zugang kann beide Profile und Notizen ansehen und bearbeiten. Sie sind keine voneinander abgeschotteten Benutzerkonten.

Die API liefert bei einem Fehler eine Meldung, die Oberfläche meldet einen Speichervorgang erst nach erfolgreicher Serverantwort. Das Datum wird bei nicht begangenen Touren entfernt. Beim Entfernen wird nur der Eintrag des gewählten Profils für die gewählte Tour gelöscht.

Die frühere Oberfläche aus PR #21 speicherte unter `kletterglueck-private-ratings-v1` im lokalen Browser. Diese Daten werden weder entfernt noch automatisch anhand von Tourennamen in die Datenbank übertragen, weil gleichnamige Touren verschiedene UUIDs haben können. Bestehende Einträge nach eindeutiger Tourenauswahl manuell übertragen.

Vor Produktionsfreigabe die SQL-Migration ausführen und eine gespeicherte Testtour auf zwei zugelassenen Geräten prüfen: Simon vergibt vier Sterne, Mama fünf; beide sehen 4,5. Anschließend Simons Eintrag ändern oder entfernen und prüfen, dass Mamas Wert erhalten bleibt. Ohne Freigabelink muss Vercel weiterhin die Anmeldung verlangen.
