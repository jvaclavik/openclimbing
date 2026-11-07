import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { parseTourGpx, Tour } from '../src/services/tours/tracks';

const API = '/api/kletterglueck/tours';
type TourMetadata = Omit<Tour, 'track'>;

const OwnGpxForm = ({
  secret,
  selected,
  busy,
  setBusy,
  onSaved,
}: {
  secret: string;
  selected: TourMetadata | null;
  busy: boolean;
  setBusy: (value: boolean) => void;
  onSaved: (tour: TourMetadata) => void;
}) => {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!secret.trim()) {
      setError('Bitte zuerst oben den Admin-Schlüssel eintragen.');
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const file = form.get('gpx');
      if (!(file instanceof File) || !file.size) {
        throw new Error(
          'Keine eigene Datei nötig. Tippe oben auf „OSM-Variante speichern“.',
        );
      }
      if (file.size > 2_000_000)
        throw new Error('Die GPX-Datei darf höchstens 2 MB groß sein.');
      const track = parseTourGpx(await file.text());
      const result = await fetch(API + (selected ? '?id=' + selected.id : ''), {
        method: selected ? 'PATCH' : 'POST',
        headers: {
          Authorization: 'Bearer ' + secret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.get('name'),
          difficulty: form.get('difficulty'),
          duration_minutes: form.get('duration')
            ? Number(form.get('duration'))
            : null,
          osm_ref: form.get('osm'),
          source: form.get('source'),
          attribution: form.get('attribution'),
          rights_confirmed: form.get('rights') === 'on',
          track,
        }),
      });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error);
      setError('');
      onSaved(body.tour);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Stack
      component="form"
      key={selected?.id ?? 'new'}
      spacing={2}
      onSubmit={save}
    >
      <Typography variant="h6" component="h2">
        Eigene GPX, nur wenn du eine hast
      </Typography>
      <TextField
        label="Tourname"
        name="name"
        defaultValue={selected?.name}
        slotProps={{ htmlInput: { maxLength: 120 } }}
      />
      <TextField
        label="Schwierigkeit"
        name="difficulty"
        defaultValue={selected?.difficulty ?? ''}
        slotProps={{ htmlInput: { maxLength: 30 } }}
      />
      <TextField
        label="Dauer in Minuten"
        name="duration"
        type="number"
        defaultValue={selected?.duration_minutes ?? ''}
        slotProps={{ htmlInput: { min: 1, max: 10080 } }}
      />
      <TextField
        label="OSM-Bezug (z. B. way/1156787758)"
        name="osm"
        defaultValue={selected?.osm_ref ?? ''}
      />
      <TextField
        label="Herkunft / Quelle"
        name="source"
        defaultValue={selected?.source}
        slotProps={{ htmlInput: { maxLength: 500 } }}
      />
      <TextField
        label="Lizenz und erforderliche Namensnennung"
        name="attribution"
        defaultValue={selected?.attribution ?? ''}
        slotProps={{ htmlInput: { maxLength: 500 } }}
      />
      <Box>
        <Typography variant="body2" component="label" htmlFor="gpx-file">
          {fileName
            ? 'Gewählt: ' + fileName
            : 'GPX in der Dateien-App wählen. Auf dem iPhone nicht bei Fotos suchen.'}
        </Typography>
        <input
          id="gpx-file"
          name="gpx"
          type="file"
          onChange={(event) =>
            setFileName(event.currentTarget.files?.[0]?.name ?? '')
          }
          style={{
            display: 'block',
            width: '100%',
            marginTop: 8,
            fontSize: 16,
          }}
        />
      </Box>
      <FormControlLabel
        control={<Checkbox name="rights" />}
        label="Ich darf diesen Track zentral speichern und mit den App-Nutzern teilen."
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        type="submit"
        variant="outlined"
        disabled={busy}
        sx={{ minHeight: 48 }}
      >
        {selected ? 'Tour und Track ersetzen' : 'Eigene Tour hinzufügen'}
      </Button>
    </Stack>
  );
};

export default function KletterglueckTouren() {
  const [secret, setSecret] = useState('');
  const [selected, setSelected] = useState<TourMetadata | null>(null);
  const [catalog, setCatalog] = useState<TourMetadata[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ error: boolean; message: string }>();

  const loadCatalog = async (after?: string) => {
    if (!secret.trim()) {
      setStatus({
        error: true,
        message: 'Bitte zuerst den Admin-Schlüssel eintragen.',
      });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        API +
          '?catalog=1' +
          (after ? '&after=' + encodeURIComponent(after) : ''),
        { headers: { Authorization: 'Bearer ' + secret } },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setCatalog((previous) =>
        after ? [...previous, ...result.tours] : result.tours,
      );
      setCursor(result.next);
      setStatus({
        error: false,
        message: result.tours.length
          ? 'Touren geladen.'
          : 'Keine weiteren Touren.',
      });
    } catch (error) {
      setStatus({ error: true, message: error.message });
    } finally {
      setBusy(false);
    }
  };

  const rememberTour = (tour: TourMetadata) => {
    setCatalog((previous) =>
      previous.some((item) => item.id === tour.id)
        ? previous.map((item) => (item.id === tour.id ? tour : item))
        : [...previous, tour],
    );
    setSelected(tour);
    setStatus({
      error: false,
      message: 'Gespeichert: ' + tour.name + '. UUID ' + tour.id,
    });
  };

  const savePilot = async () => {
    if (!secret.trim()) {
      setStatus({
        error: true,
        message:
          'Bitte zuerst oben den Admin-Schlüssel eintragen. Eine GPX-Datei brauchst du nicht.',
      });
      return;
    }
    setBusy(true);
    try {
      const result = await fetch(API, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + secret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pilot: 'norissteig-osm-variante',
          rights_confirmed: true,
        }),
      });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error);
      rememberTour(body.tour);
    } catch (error) {
      setStatus({ error: true, message: error.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box component="main" sx={{ maxWidth: 640, mx: 'auto', p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Kletterglück · Tourenverwaltung
        </Typography>
        <TextField
          label="Admin-Schlüssel"
          type="password"
          autoComplete="off"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />
        <Typography variant="body2">
          Für den Test brauchst du keine GPX-Datei. Schlüssel eintragen und den
          großen Knopf tippen. Gespeichert wird nur die OpenStreetMap-Variante
          ab Hirschbach, ohne die Brettl-Querung. Das ist nicht der
          Originaltrack.
        </Typography>
        <Button
          variant="contained"
          disabled={busy}
          onClick={() => void savePilot()}
          sx={{ minHeight: 48 }}
        >
          OSM-Variante speichern
        </Button>
        <Button
          disabled={busy}
          onClick={() => void loadCatalog()}
          sx={{ minHeight: 48 }}
        >
          Gespeicherte Touren laden
        </Button>
        {catalog.length > 0 && (
          <TextField
            select
            value={selected?.id ?? ''}
            onChange={(event) =>
              setSelected(
                catalog.find((tour) => tour.id === event.target.value) ?? null,
              )
            }
            slotProps={{
              select: {
                native: true,
                inputProps: { 'aria-label': 'Tour auswählen' },
              },
            }}
          >
            <option value="">Neue Tour</option>
            {catalog.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.name}
              </option>
            ))}
          </TextField>
        )}
        {selected && (
          <Button
            href={'/kletterglueck-bewertungen?tour=' + selected.id}
            sx={{ minHeight: 48 }}
          >
            Diese Tour bewerten
          </Button>
        )}
        {cursor && (
          <Button disabled={busy} onClick={() => void loadCatalog(cursor)}>
            Weitere Touren laden
          </Button>
        )}
        {status && (
          <Alert severity={status.error ? 'error' : 'success'}>
            {status.message}
          </Alert>
        )}
        <OwnGpxForm
          secret={secret}
          selected={selected}
          busy={busy}
          setBusy={setBusy}
          onSaved={rememberTour}
        />
      </Stack>
    </Box>
  );
}
