import React, { useEffect, useState } from 'react';
import {
  Button,
  IconButton,
  ListItemIcon,
  MenuItem,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import styled from '@emotion/styled';
import { t } from '../../../../../services/intl';
import { isClimbingRoute as getIsClimbingRoute } from '../../../../../utils';
import { FeatureTags } from '../../../../../services/types';
import { Setter } from '../../../../../types';
import { useCurrentItem, useEditContext } from '../../context/EditContext';
import { getNewRelationItem } from '../../context/itemsHelpers';
import { useMoreMenu } from '../../../Climbing/useMoreMenu';
import { useSnackbar } from '../../../../utils/SnackbarContext';
import { parseOsmShortId } from './parseOsmShortId';
import { useLinkEditItem } from './useLinkEditItem';

type Scene = null | 'name' | 'url';

const getNewParentTags = (currentTags: FeatureTags): FeatureTags => {
  if (getIsClimbingRoute(currentTags)) {
    return {
      type: 'site',
      site: 'climbing',
      climbing: 'crag',
      sport: 'climbing',
    };
  }
  if (currentTags.climbing === 'crag') {
    return {
      type: 'site',
      site: 'climbing',
      climbing: 'area',
      sport: 'climbing',
    };
  }
  return { type: 'site' };
};

const StyledCloseIcon = styled(CloseIcon)`
  font-size: 16px;
`;

const CancelButton = ({
  setLabel,
  setScene,
}: {
  setLabel: Setter<string>;
  setScene: Setter<Scene>;
}) => (
  <IconButton
    onClick={() => {
      setLabel('');
      setScene(null);
    }}
  >
    <StyledCloseIcon />
  </IconButton>
);

const ShowFormButton = ({ onClick }: { onClick: () => void }) => {
  const { tags } = useCurrentItem();
  const isClimbingRoute = getIsClimbingRoute(tags);
  const isClimbingCrag = tags.climbing === 'crag';

  return (
    <Button startIcon={<AddIcon />} onClick={onClick} variant="text">
      {isClimbingRoute
        ? t('editdialog.parents.add_climbing_crag')
        : isClimbingCrag
          ? t('editdialog.parents.add_climbing_area')
          : t('editdialog.parents.add_parent')}
    </Button>
  );
};

const AddParentMoreMenu = ({ onAddFromUrl }: { onAddFromUrl: () => void }) => {
  const { MoreMenu, handleClickMore, handleCloseMore } = useMoreMenu();

  return (
    <>
      <IconButton size="small" color="secondary" onClick={handleClickMore}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <MoreMenu>
        <MenuItem
          onClick={(e) => {
            handleCloseMore(e);
            onAddFromUrl();
          }}
        >
          <ListItemIcon>
            <LinkIcon
              sx={{
                fontSize: 'small',
              }}
            />
          </ListItemIcon>
          {t('editdialog.members.add_from_url')}
        </MenuItem>
      </MoreMenu>
    </>
  );
};

export const AddParentForm = () => {
  const [scene, setScene] = useState<Scene>(null);
  const [label, setLabel] = useState('');
  const { addItem, setCurrent } = useEditContext();
  const current = useCurrentItem();
  const { addAsParent } = useLinkEditItem();
  const { showToast } = useSnackbar();

  const handleAddByName = (e: {
    preventDefault: () => void;
    ctrlKey?: boolean;
    metaKey?: boolean;
  }) => {
    e.preventDefault();
    const tags = {
      ...getNewParentTags(current.tags),
      ...(label.trim() ? { name: label.trim() } : {}),
    };
    const newParent = getNewRelationItem(tags, [
      {
        shortId: current.shortId,
        role: '',
        originalLabel: current.tags.name,
      },
    ]);
    addItem(newParent);
    setScene(null);
    setLabel('');
    if (e.ctrlKey || e.metaKey) {
      setCurrent(newParent.shortId);
    }
  };

  const handleAddFromUrl = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const shortId = parseOsmShortId(label);
    if (!shortId) {
      showToast(t('editdialog.members.url_invalid'), 'warning');
      return;
    }
    if (!shortId.startsWith('r')) {
      showToast(t('editdialog.parents.not_a_relation'), 'warning');
      return;
    }
    try {
      await addAsParent(shortId);
      setScene(null);
      setLabel('');
    } catch {
      showToast(t('editdialog.members.url_invalid'), 'warning');
    }
  };

  useEffect(() => {
    const downHandler = (e: KeyboardEvent) => {
      if (scene !== 'name' && scene !== 'url') return;
      if (e.key === 'Enter') {
        if (scene === 'url') {
          void handleAddFromUrl(e);
        } else {
          handleAddByName(e);
        }
      }
      if (e.key === 'Escape') {
        setScene(null);
      }
    };
    window.addEventListener('keydown', downHandler);
    return () => window.removeEventListener('keydown', downHandler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, label]);

  if (scene === 'name') {
    return (
      <>
        <TextField
          value={label}
          size="small"
          label={t('editdialog.members.name')}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
        />
        <Button onClick={handleAddByName} variant="text">
          {t('editdialog.members.confirm')}
        </Button>
        <AddParentMoreMenu onAddFromUrl={() => setScene('url')} />
        <CancelButton setLabel={setLabel} setScene={setScene} />
      </>
    );
  }

  if (scene === 'url') {
    return (
      <>
        <TextField
          value={label}
          size="small"
          label={t('editdialog.members.add_from_url')}
          placeholder={t('editdialog.members.url_placeholder')}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
          sx={{ minWidth: 220, flex: 1 }}
        />
        <Button onClick={handleAddFromUrl} variant="text">
          {t('editdialog.members.confirm')}
        </Button>
        <CancelButton setLabel={setLabel} setScene={setScene} />
      </>
    );
  }

  return <ShowFormButton onClick={() => setScene('name')} />;
};
