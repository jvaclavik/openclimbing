import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { RatingProfile } from '../src/services/tours/ratings';
import { ViaFerrataRatings } from '../src/components/MyRatings/ViaFerrataRatings';
import { useFamilyRatings } from '../src/components/MyRatings/useFamilyRatings';

export default function Familienbewertungen() {
  const {
    profile,
    setProfile,
    query,
    setQuery,
    selected,
    setSelected,
    currentTour,
    setCurrentTour,
    ratings,
    stars,
    setStars,
    visited,
    setVisited,
    date,
    setDate,
    note,
    setNote,
    error,
    notice,
    cursor,
    catalogLoading,
    busy,
    average,
    options,
    list,
    save,
  } = useFamilyRatings();
  return (
    <Box component="main" sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Unsere Tourbewertungen
        </Typography>
        <Typography variant="body2">
          Gemeinsame Familienwertung. Mit eurem privaten Zugang könnt ihr beide
          Profile ansehen und bearbeiten.
        </Typography>
        <ViaFerrataRatings />
        <Button href="/">Zur Karte</Button>
        <TextField
          select
          label="Profil"
          value={profile}
          disabled={busy}
          onChange={(event) => setProfile(event.target.value as RatingProfile)}
        >
          <MenuItem value="Simon">Simon</MenuItem>
          <MenuItem value="Mama">Mama</MenuItem>
        </TextField>
        <Stack
          component="form"
          direction="row"
          spacing={1}
          onSubmit={(event) => {
            event.preventDefault();
            void list();
          }}
        >
          <TextField
            fullWidth
            label="Tour suchen"
            value={query}
            disabled={busy}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 120 } }}
          />
          <Button type="submit" disabled={busy || catalogLoading}>
            Suchen
          </Button>
        </Stack>
        <TextField
          select
          label="Gespeicherte Tour"
          value={selected}
          disabled={busy}
          onChange={(event) => {
            setSelected(event.target.value);
            setCurrentTour(undefined);
          }}
        >
          <MenuItem value="">Tour auswählen</MenuItem>
          {options.map((tour) => (
            <MenuItem key={tour.id} value={tour.id}>
              {tour.name}
            </MenuItem>
          ))}
        </TextField>
        {cursor && (
          <Button disabled={busy} onClick={() => void list(cursor)}>
            Weitere Touren laden
          </Button>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {notice && <Alert severity="info">{notice}</Alert>}
        {currentTour && (
          <>
            <Typography component="h2" variant="h6">
              {currentTour.name}
            </Typography>
            <Typography component="label" htmlFor="family-rating">
              Sterne für {profile}
            </Typography>
            <Rating
              id="family-rating"
              name="family-rating"
              value={stars}
              disabled={busy}
              onChange={(_, value) => setStars(value)}
              getLabelText={(value) =>
                value + (value === 1 ? ' Stern' : ' Sterne')
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={visited}
                  disabled={busy}
                  onChange={(event) => setVisited(event.target.checked)}
                />
              }
              label="Begangen"
            />
            {visited && (
              <TextField
                label="Datum (optional)"
                type="date"
                value={date}
                disabled={busy}
                onChange={(event) => setDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
            <TextField
              multiline
              minRows={2}
              label="Notiz (für euch beide sichtbar)"
              value={note}
              disabled={busy}
              onChange={(event) => setNote(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 2000 } }}
            />
            <Button
              variant="contained"
              disabled={busy}
              onClick={() => void save()}
            >
              Für {profile} speichern
            </Button>
            {ratings.some((rating) => rating.profile === profile) && (
              <Button
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm('Deine Bewertung für diese Tour entfernen?')
                  )
                    void save(true);
                }}
              >
                Eigene Bewertung entfernen
              </Button>
            )}
            <Typography>
              Familienwertung{' '}
              {average === null
                ? '–'
                : average.toLocaleString('de-DE', {
                    maximumFractionDigits: 1,
                  })}{' '}
              / 5
            </Typography>
            {(['Simon', 'Mama'] as const).map((name) => {
              const rating = ratings.find((entry) => entry.profile === name);
              return (
                <Typography key={name}>
                  {name}: {rating?.stars ?? '–'} Sterne
                  {rating?.visited ? ' · begangen' : ''}
                </Typography>
              );
            })}
          </>
        )}
      </Stack>
    </Box>
  );
}
