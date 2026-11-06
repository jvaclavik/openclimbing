import { useState } from 'react';
import Star from '@mui/icons-material/Star';
import StarBorder from '@mui/icons-material/StarBorder';
import CheckCircle from '@mui/icons-material/CheckCircle';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
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

  if (
    feature.point ||
    !feature.osmMeta?.id ||
    !feature.center ||
    !isViaFerrataTags(feature.tags)
  ) {
    return null;
  }
  const item = featureToItem(feature);
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
      <QuickActionButton
        icon={visited ? CheckCircle : CheckCircleOutline}
        label={visited ? 'Schon da gewesen' : 'Als besucht markieren'}
        pressed={visited}
        onClick={() => void toggle(VISITED_ID, visited)}
      />
      <QuickActionButton
        icon={BookmarkBorder}
        label="Zu Listen"
        onClick={() => setPickerOpen(true)}
      />
      <ListPickerDialog
        key={item.shortId}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        item={item}
      />
    </>
  );
};
