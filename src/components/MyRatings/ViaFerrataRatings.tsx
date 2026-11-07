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

export const ViaFerrataRatings = ({ name }: { name: string }) => {
  const [data, setData] = useState<Ratings | null>(null);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!name.trim()) return undefined;
    const controller = new AbortController();
    setData(null);
    setError('');
    setMissing(false);
    void (async () => {
      try {
        const response = await fetch(
          `/api/kletterglueck/via-ferrata?name=${encodeURIComponent(name)}`,
          { signal: controller.signal },
        );
        const body = (await response.json()) as Ratings;
        if (response.status === 404) {
          setMissing(true);
          return;
        }
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
  }, [name]);

  if (!name.trim() || missing) return null;
  if (error) return <Alert severity="warning">{error}</Alert>;
  if (!data)
    return (
      <Typography variant="body2">
        Bewertungen von via-ferrata.de werden geladen.
      </Typography>
    );

  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      <Typography component="h2" variant="h6">
        via-ferrata.de
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Rating value={data.average} precision={0.1} readOnly />
        <Typography>
          {data.average.toLocaleString('de-DE')} aus {data.count}
        </Typography>
      </Stack>
      {data.reviews.map((review) => (
        <Stack key={`${review.url}-${review.title}`} spacing={0.5}>
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
          {data.name} auf via-ferrata.de
        </Link>
        .
        {data.reviews.length < data.count
          ? ` ${data.count - data.reviews.length} weitere nur dort.`
          : ''}
      </Typography>
    </Stack>
  );
};
