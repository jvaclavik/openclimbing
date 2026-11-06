import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  FERRATA_DETAIL_VIDEO_OPENED,
  getFerrataDetailClips,
} from '../../Map/HiddenFerrataClip/matchHiddenFerrataClip';
import { useState } from 'react';
import Star from '@mui/icons-material/Star';
import StarBorder from '@mui/icons-material/StarBorder';
import CheckCircle from '@mui/icons-material/CheckCircle';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
import { featureToItem } from '../../../services/my-lists/featureToItem';
import {
  FAVORITES_ID,
  VISITED_ID,
} from '../../../services/my-lists/localFerrataLists';
import { isViaFerrataTags } from '../../../services/tagging/viaFerrataScale';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useMyListsContext } from '../../utils/MyListsContext';
import { ListPickerDialog } from '../../MyLists/ListPickerDialog';
import { QuickActionButton } from './QuickActionButton';

export const FerrataListActions = () => {
  const { feature } = useFeatureContext();
  const { listsContaining, addToList, removeFromList } = useMyListsContext();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [clipIndex, setClipIndex] = useState<number | null>(null);

  if (
    feature.point ||
    !feature.osmMeta?.id ||
    !feature.center ||
    !isViaFerrataTags(feature.tags)
  ) {
    return null;
  }
  const item = featureToItem(feature);
  const clips = getFerrataDetailClips(item.shortId);
  const containing = listsContaining(item.shortId);
  const favorite = containing.some(({ id }) => id === FAVORITES_ID);
  const visited = containing.some(({ id }) => id === VISITED_ID);
  const toggle = (id: number, selected: boolean) =>
    selected ? removeFromList(id, item.shortId) : addToList(id, item);

  return (
    <>
      <QuickActionButton
        icon={favorite ? Star : StarBorder}
        label={favorite ? 'Favorisiert' : 'Favorisieren'}
        pressed={favorite}
        onClick={() => void toggle(FAVORITES_ID, favorite)}
      />
      {clips && (
        <QuickActionButton
          icon={PlayCircleOutlined}
          label="Video ansehen"
          onClick={() => {
            document.dispatchEvent(new Event(FERRATA_DETAIL_VIDEO_OPENED));
            setClipIndex(0);
          }}
        />
      )}
      <QuickActionButton
        icon={visited ? CheckCircle : CheckCircleOutlined}
        label={visited ? 'Schon da gewesen' : 'Als besucht markieren'}
        pressed={visited}
        onClick={() => void toggle(VISITED_ID, visited)}
      />
      <QuickActionButton
        icon={BookmarkBorder}
        label="Zu Listen"
        onClick={() => setPickerOpen(true)}
      />
      {clips && clipIndex !== null && (
        <Dialog open onClose={() => setClipIndex(null)} fullWidth maxWidth="xs">
          <DialogTitle>{item.label}</DialogTitle>
          <DialogContent sx={{ display: 'grid', justifyItems: 'center' }}>
            <video
              key={clips[clipIndex]}
              src={clips[clipIndex]}
              aria-label={`Clip ${clipIndex + 1} von ${clips.length}`}
              controls
              playsInline
              preload="metadata"
              style={{ maxWidth: '100%', maxHeight: '55dvh' }}
            />
          </DialogContent>
          <DialogActions>
            {clips.length > 1 && (
              <Button
                onClick={() => setClipIndex((clipIndex + 1) % clips.length)}
              >
                Nächster Clip ({clipIndex + 1}/{clips.length})
              </Button>
            )}
            <Button onClick={() => setClipIndex(null)}>Schließen</Button>
          </DialogActions>
        </Dialog>
      )}
      <ListPickerDialog
        key={item.shortId}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        item={item}
      />
    </>
  );
};
