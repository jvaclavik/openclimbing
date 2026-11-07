import { Button, Stack, Typography } from '@mui/material';
import RouteIcon from '@mui/icons-material/Route';
import { useState } from 'react';
import { useFeatureContext } from '../../utils/FeatureContext';
import { gpxFileName, linesFromGeometry, viaFerrataGpx } from './komootGpx';

export const KomootRouteButton = () => {
  const { feature } = useFeatureContext();
  const [hint, setHint] = useState('');
  const name = String(feature.tags.name || feature.tags['name:de'] || 'Klettersteig');
  const gpx = viaFerrataGpx(name, linesFromGeometry(feature.geometry));
  if (!gpx) return null;

  const openKomoot = async () => {
    const file = new File([gpx], gpxFileName(name), {
      type: 'application/gpx+xml',
    });
    const share = navigator.share?.bind(navigator);
    const canShare = navigator.canShare?.({ files: [file] });
    if (share && canShare) {
      try {
        await share({
          files: [file],
          title: name,
          text: 'In Komoot öffnen',
        });
        setHint('');
        return;
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    setHint('Datei geladen. In Komoot: Import, dann diese GPX wählen.');
  };

  return (
    <Stack spacing={0.5} sx={{ mb: 1.5, alignItems: 'flex-start' }}>
      <Button
        variant="contained"
        startIcon={<RouteIcon />}
        onClick={() => void openKomoot()}
        sx={{ textTransform: 'none' }}
      >
        In Komoot öffnen
      </Button>
      <Typography variant="caption" color="text.secondary">
        {hint ||
          'Die Linie dieses Steigs von der Karte. Auf dem iPhone in der Liste Komoot antippen.'}
      </Typography>
    </Stack>
  );
};
