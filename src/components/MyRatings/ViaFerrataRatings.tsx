import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  Rating,
  Stack,
  Typography,
} from '@mui/material';
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
  difficulty: string;
  duration: string;
  description: { kind: 'h2' | 'p'; text: string }[];
  images: string[];
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
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (!name.trim()) return undefined;
    const controller = new AbortController();
    setData(null);
    setError('');
    setMissing(false);
    setShowAllReviews(false);
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
  if (!data) return null;
  const visibleReviews = showAllReviews
    ? data.reviews
    : data.reviews.slice(0, 5);

  return (
    <Stack
      spacing={1.75}
      sx={{
        mb: 2,
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="overline" color="text.secondary">
        via-ferrata.de
      </Typography>
      {(data.difficulty || data.duration) && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {data.difficulty && (
            <Chip size="small" label={`Schwierigkeit ${data.difficulty}`} />
          )}
          {data.duration && <Chip size="small" label={`Dauer ${data.duration}`} />}
        </Stack>
      )}
      {data.count > 0 && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Rating value={data.average} precision={0.1} readOnly />
          <Typography variant="body2">
            {data.average.toLocaleString('de-DE')} aus {data.count} Bewertungen
          </Typography>
        </Stack>
      )}
      {data.images.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ mx: -1.5, px: 1.5, overflowX: 'auto', scrollSnapType: 'x mandatory' }}
        >
          {data.images.map((src) => (
            <Box
              key={src}
              component="img"
              src={src}
              alt={data.name}
              sx={{
                width: 220,
                height: 148,
                objectFit: 'cover',
                borderRadius: 1.5,
                flex: '0 0 auto',
                scrollSnapAlign: 'start',
              }}
            />
          ))}
        </Stack>
      )}
      {data.description.map((block) => (
        <Typography
          key={block.text}
          component={block.kind === 'h2' ? 'h3' : 'p'}
          variant={block.kind === 'h2' ? 'subtitle1' : 'body2'}
          sx={{ lineHeight: block.kind === 'p' ? 1.6 : undefined, m: 0 }}
        >
          {block.text}
        </Typography>
      ))}
      {visibleReviews.map((review) => (
        <Stack
          key={`${review.url}-${review.title}`}
          spacing={0.5}
          sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'background.default' }}
        >
          <Typography component="h3" variant="subtitle2">
            {review.title}
          </Typography>
          <Rating value={review.stars} precision={0.5} readOnly size="small" />
          <Typography variant="caption" color="text.secondary">
            {[review.author, review.date].filter(Boolean).join(' · ')}
          </Typography>
          {review.text && (
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              {review.text}
            </Typography>
          )}
        </Stack>
      ))}
      {data.reviews.length > 5 && !showAllReviews && (
        <Button
          size="small"
          onClick={() => setShowAllReviews(true)}
          sx={{ alignSelf: 'flex-start', px: 0.5 }}
        >
          Mehr anzeigen
        </Button>
      )}
      <Typography variant="caption" color="text.secondary">
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
