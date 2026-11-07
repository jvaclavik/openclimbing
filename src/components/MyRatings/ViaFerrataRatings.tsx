import { Alert, Link, Rating, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

type Review = {
  title: string;
  stars: number;
  author: string;
  date: string;
  text: string;
  url: string;
};

type Ratings = {
  name: string;
  average: number;
  count: number;
  reviews_url: string;
  reviews: Review[];
  error?: string;
};

export const ViaFerrataRatings = ({ slug = 'norissteig' }: { slug?: string }) => {
  const [data, setData] = useState<Ratings | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(
          `/api/kletterglueck/via-ferrata?slug=${encodeURIComponent(slug)}`,
          { signal: controller.signal },
        );
        const body = (await response.json()) as Ratings;
        if (!response.ok) throw new Error(body.error);
        setData(body);
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : 'via-ferrata.de ist gerade nicht erreichbar.',
          );
      }
    })();
    return () => controller.abort();
  }, [slug]);

  if (error) return <Alert severity="warning">{error}</Alert>;
  if (!data) return <Typography>Bewertungen von via-ferrata.de werden geladen.</Typography>;

  return (
    <Stack id="via-ferrata" spacing={1.5}>
      <Typography component="h2" variant="h6">
        {data.name} auf via-ferrata.de
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Rating value={data.average} precision={0.1} readOnly />
        <Typography>
          {data.average.toLocaleString('de-DE')} aus {data.count} Bewertungen
        </Typography>
      </Stack>
      {data.reviews.map((review) => (
        <Stack key={review.url + review.title} spacing={0.5}>
          <Typography component="h3" variant="subtitle1">
            {review.title}
          </Typography>
          <Rating value={review.stars} precision={0.5} readOnly size="small" />
          <Typography variant="body2" color="text.secondary">
            {[review.author, review.date].filter(Boolean).join(' · ')}
          </Typography>
          {review.text && <Typography variant="body2">{review.text}</Typography>}
        </Stack>
      ))}
      <Typography variant="body2">
        Quelle{' '}
        <Link href={data.reviews_url} target="_blank" rel="noreferrer">
          via-ferrata.de
        </Link>
        . Anzeige mit Genehmigung des Betreibers. Fotos bleiben auf der
        Originalseite.
        {data.reviews.length < data.count
          ? ` ${data.count - data.reviews.length} weitere stehen nur dort.`
          : ''}
      </Typography>
    </Stack>
  );
};
