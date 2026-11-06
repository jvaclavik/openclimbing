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

export default function KletterglueckTouren() {
  const [secret, setSecret] = useState('');
  const [selected, setSelected] = useState<TourMetadata | null>(null);
  const [catalog, setCatalog] = useState<TourMetadata[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ error: boolean; message: string }>();
  const headers = { Authorization: 'Bearer ' + secret };

  const loadCatalog = async (after?: string) => {
    setBusy(true);
    try {
      const response = await fetch(
        API +
          '?catalog=1' +
          (after ? '&after=' + encodeURIComponent(after) : ''),
        { headers },
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

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const file = form.get('gpx');
      if (!(file instanceof File) || !file.size || file.size > 2_000_000) {
        throw new Error('Bitte eine GPX-Datei bis 2 MB auswählen.');
      }
      const track = parseTourGpx(await file.text());
      const result = await fetch(API + (selected ? '?id=' + selected.id : ''), {
        method: selected ? 'PATCH' : 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
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
      setCatalog((previous) =>
        previous.some((tour) => tour.id === body.tour.id)
          ? previous.map((tour) =>
              tour.id === body.tour.id ? body.tour : tour,
            )
          : [...previous, body.tour],
      );
      setSelected(body.tour);
      setStatus({ error: false, message: 'Tour gespeichert: ' + body.tour.id });
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
          onChange={(e) => setSecret(e.target.value)}
        />
        <Button disabled={busy || !secret} onClick={() => void loadCatalog()}>
          Gespeicherte Touren laden
        </Button>
        {catalog.length > 0 && (
          <TextField
            select
            value={selected?.id ?? ''}
            onChange={(e) =>
              setSelected(
                catalog.find((tour) => tour.id === e.target.value) ?? null,
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
        {cursor && (
          <Button
            disabled={busy || !secret}
            onClick={() => void loadCatalog(cursor)}
          >
            Weitere Touren laden
          </Button>
        )}
        {status && (
          <Alert severity={status.error ? 'error' : 'success'}>
            {status.message}
          </Alert>
        )}
        <Stack
          component="form"
          key={selected?.id ?? 'new'}
          spacing={2}
          onSubmit={save}
        >
          <TextField
            label="Tourname"
            name="name"
            required
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
            required
            defaultValue={selected?.source}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
          <TextField
            label="Lizenz und erforderliche Namensnennung"
            name="attribution"
            defaultValue={selected?.attribution ?? ''}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
          <label>
            GPX-Track{' '}
            <input
              name="gpx"
              type="file"
              accept=".gpx,application/gpx+xml"
              required
            />
          </label>
          <FormControlLabel
            control={<Checkbox name="rights" required />}
            label="Ich darf diesen Track zentral speichern und mit den App-Nutzern teilen."
          />
          <Button type="submit" variant="contained" disabled={busy || !secret}>
            {selected ? 'Tour und Track ersetzen' : 'Tour hinzufügen'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
