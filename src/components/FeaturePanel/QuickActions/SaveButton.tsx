import Bookmark from '@mui/icons-material/Bookmark';
import BookmarkBorder from '@mui/icons-material/BookmarkBorder';
import { Box, Button, Popover, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import { getShortId } from '../../../services/helpers';
import { t } from '../../../services/intl';
import { featureToItem } from '../../../services/my-lists/featureToItem';
import { UserList } from '../../../services/my-lists/myListsTypes';
import { LonLat } from '../../../services/types';
import { useIsClient } from '../../helpers';
import { ListBadges } from '../../MyLists/ListBadges';
import { formatListLabel } from '../../MyLists/listEmoji';
import { ListPickerDialog } from '../../MyLists/ListPickerDialog';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useMapStateContext, View } from '../../utils/MapStateContext';
import { useMyListsContext } from '../../utils/MyListsContext';
import { useOsmAuthContext } from '../../utils/OsmAuthContext';
import { useSnackbar } from '../../utils/SnackbarContext';
import { QuickActionButton } from './QuickActionButton';

const viewToLonLat = ([, lat, lon]: View): LonLat => [
  parseFloat(lon),
  parseFloat(lat),
];

type SavedPopoverProps = {
  anchorEl: HTMLButtonElement | null;
  list: UserList | undefined;
  onClose: () => void;
  onChange: () => void;
};

const SavedPopover = ({
  anchorEl,
  list,
  onClose,
  onChange,
}: SavedPopoverProps) => (
  <Popover
    open={!!list}
    anchorEl={anchorEl}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
  >
    <Box p={1.5} display="flex" alignItems="center" gap={1}>
      <Typography variant="body2">
        {t('mylists.saved_to', {
          list: list ? formatListLabel(list) : '',
        })}
      </Typography>
      <Button size="small" variant="text" onClick={onChange}>
        {t('mylists.change')}
      </Button>
    </Box>
  </Popover>
);

export const SaveButton = () => {
  const { feature } = useFeatureContext();
  const { view } = useMapStateContext();
  const { loggedIn, handleLogin } = useOsmAuthContext();
  const { showToast } = useSnackbar();
  const { lists, isInAnyList, listsContaining, addToList, lastUsedListId } =
    useMyListsContext();
  const isClient = useIsClient();

  const anchorRef = useRef<HTMLButtonElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savedListId, setSavedListId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  if (feature.point) {
    return null;
  }

  const shortId = feature.osmMeta?.id ? getShortId(feature.osmMeta) : null;
  const inAny = isClient && shortId ? isInAnyList(shortId) : false;
  const containingLists = isClient && shortId ? listsContaining(shortId) : [];
  const savedList = savedListId
    ? (lists ?? []).find((l) => l.id === savedListId)
    : undefined;
  const item = featureToItem(feature, viewToLonLat(view));

  const promptLogin = () => {
    showToast(
      t('mylists.login_required'),
      'info',
      <Button color="inherit" size="small" onClick={handleLogin}>
        {t('mylists.login_cta')}
      </Button>,
    );
  };

  const saveToDefault = async () => {
    const currentLists = lists ?? [];
    const defaultListId =
      (lastUsedListId &&
        currentLists.find((l) => l.id === lastUsedListId)?.id) ??
      currentLists[0]?.id ??
      null;

    if (!defaultListId) {
      setPickerOpen(true);
      return;
    }
    setSaving(true);
    try {
      await addToList(defaultListId, item);
      setSavedListId(defaultListId);
    } catch (e) {
      showToast(`Error: ${e}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClick = () => {
    if (!loggedIn) return promptLogin();
    if (inAny) return setPickerOpen(true);
    return saveToDefault();
  };

  return (
    <>
      <QuickActionButton
        ref={anchorRef}
        onClick={handleClick}
        loading={saving}
        label={
          inAny ? t('featurepanel.saved_button') : t('featurepanel.save_button')
        }
        suffix={
          inAny && containingLists.length > 0 ? (
            <ListBadges lists={containingLists} />
          ) : undefined
        }
        icon={inAny ? Bookmark : BookmarkBorder}
      />

      <SavedPopover
        anchorEl={anchorRef.current}
        list={savedList}
        onClose={() => setSavedListId(null)}
        onChange={() => {
          setSavedListId(null);
          setPickerOpen(true);
        }}
      />

      <ListPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        item={item}
      />
    </>
  );
};
