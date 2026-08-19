import styled from '@emotion/styled';
import {
  Button,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import { useEditContext } from '../context/EditContext';
import { getRangeSelection, toggleSelectedId } from '../context/selection';
import React, { useRef } from 'react';
import { EditDataItem } from '../context/types';
import WarningIcon from '@mui/icons-material/Warning';
import { setEditTabDragData } from './FeatureEditSection/editItemDnd';
import { t } from '../../../../services/intl';
import { getApiId } from '../../../../services/helpers';

const StyledTypography = styled(Typography, {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{ $deleted: boolean }>`
  ${({ $deleted }) => $deleted && 'text-decoration: line-through;'}
`;

const StyledTabs = styled(Tabs)`
  border-color: ${({ theme }) => theme.palette.divider};
  && .MuiTab-root {
    text-align: left;
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    border-right: 1px solid ${({ theme }) => theme.palette.divider};
    resize: horizontal;
    width: 200px;
    min-width: 120px;
    max-width: 50%;

    .MuiTab-root {
      align-items: baseline;
      border-bottom: solid 1px ${({ theme }) => theme.palette.divider};
    }
  }

  ${({ theme }) => theme.breakpoints.down('sm')} {
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};

    .MuiTab-root {
      align-items: center;
    }
  }
`;

const ModifiedBadgeHitArea = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 8px 8px 0 0;
`;

const ModifiedDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.palette.primary.main};
`;

const RevertButton = styled(Button)`
  min-width: 0;
  padding: 0;
  font-size: 11px;
  line-height: 1.3;
  text-transform: none;
  opacity: 0.85;
  color: inherit;

  &:hover {
    opacity: 1;
    background: transparent;
    text-decoration: underline;
  }
`;

const ModifiedBadge = ({ item }: { item: EditDataItem }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isNew = getApiId(item.shortId).id < 0;
  const { items, current, setCurrent, setSelectedIds, removeItem } =
    useEditContext();

  const handleRevert = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (!isNew) {
      item.revertChanges();
      return;
    }

    const shortId = item.shortId;
    items.forEach((other) => {
      if (other.members?.some((member) => member.shortId === shortId)) {
        other.setMembers((prev) =>
          (prev ?? []).filter((member) => member.shortId !== shortId),
        );
      }
    });

    const idx = items.findIndex((entry) => entry.shortId === shortId);
    const nextCurrent =
      items[idx - 1]?.shortId ?? items[idx + 1]?.shortId ?? '';
    if (current === shortId && nextCurrent) {
      setCurrent(nextCurrent);
    }
    setSelectedIds((prev) => {
      const next = prev.filter((id) => id !== shortId);
      return next.length ? next : nextCurrent ? [nextCurrent] : [];
    });
    removeItem(shortId);
  };

  return (
    <Tooltip
      arrow
      enterDelay={200}
      placement={isSmallScreen ? 'bottom' : 'right'}
      title={
        <Stack
          sx={{
            alignItems: 'flex-start',
            gap: 0.25,
          }}
        >
          <span>
            {isNew ? t('editdialog.new_item') : t('editdialog.modified')}
          </span>
          <RevertButton
            type="button"
            size="small"
            color="inherit"
            startIcon={<UndoIcon sx={{ fontSize: 12 }} />}
            onClick={handleRevert}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {t('editdialog.revert')}
          </RevertButton>
        </Stack>
      }
    >
      <ModifiedBadgeHitArea>
        <ModifiedDot />
      </ModifiedBadgeHitArea>
    </Tooltip>
  );
};

const StyledWarningIcon = styled(WarningIcon)`
  font-size: 15px;
`;

const WarningBadge = ({ item }: { item: EditDataItem }) => {
  const { validate } = useEditContext();
  return validate &&
    item.shortId[0] === 'n' &&
    item.nodeLonLat === undefined ? (
    <StyledWarningIcon color="warning" />
  ) : null;
};

type TabLabelProps = {
  item: EditDataItem;
};

const TabLabel = ({ item }: TabLabelProps) => {
  const { tags, presetLabel, toBeDeleted, modified } = item;
  const title = tags.name || presetLabel;

  return (
    <>
      {modified && <ModifiedBadge item={item} />}
      <Stack
        direction="column"
        sx={{
          alignItems: 'flex-start',
          width: '100%',
        }}
      >
        <Stack
          direction="row"
          sx={{
            gap: 1,
            alignItems: 'center',
            width: '100%',
          }}
        >
          <WarningBadge item={item} />
          <StyledTypography
            variant="button"
            $deleted={toBeDeleted}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {title}
          </StyledTypography>
        </Stack>
        {tags.name && presetLabel ? (
          <Typography
            variant="caption"
            sx={{
              textTransform: 'lowercase',
              whiteSpace: 'nowrap',
            }}
          >
            {presetLabel}
          </Typography>
        ) : null}
      </Stack>
    </>
  );
};

export const ItemsTabs = () => {
  const { items, current, setCurrent, selectedIds, setSelectedIds } =
    useEditContext();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const suppressClickRef = useRef(false);

  // All selection is handled on the Tab's onClick so we can read the keyboard
  // modifiers and also react to clicks on the already-active tab (MUI Tabs
  // `onChange` doesn't fire in that case). Cmd/Ctrl+click toggles a tab in the
  // multi-selection, Shift+click selects the whole range from the active tab.
  const handleTabClick = (event: React.MouseEvent, shortId: string) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.shiftKey) {
      event.preventDefault();
      const orderedIds = items.map((item) => item.shortId);
      setSelectedIds(getRangeSelection(orderedIds, current, shortId));
      setCurrent(shortId);
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      const wasSelected = selectedIds.includes(shortId);
      const next = toggleSelectedId(selectedIds, shortId);
      setSelectedIds(next);
      if (!wasSelected) {
        setCurrent(shortId);
      } else if (shortId === current && next.length > 0) {
        setCurrent(next[next.length - 1]);
      }
      return;
    }

    setSelectedIds([shortId]);
    setCurrent(shortId);
  };

  return (
    <>
      {items.length > 1 && (
        <StyledTabs
          orientation={isSmallScreen ? 'horizontal' : 'vertical'}
          variant="scrollable"
          value={current}
          onChange={() => {}}
        >
          {items.map((item, idx) => {
            const isMultiSelected =
              selectedIds.includes(item.shortId) && item.shortId !== current;
            return (
              <Tab
                key={idx}
                label={<TabLabel item={item} />}
                value={item.shortId}
                draggable
                onDragStart={(event) => {
                  suppressClickRef.current = true;
                  setEditTabDragData(event.dataTransfer, item.shortId);
                }}
                onDragEnd={() => {
                  window.setTimeout(() => {
                    suppressClickRef.current = false;
                  }, 0);
                }}
                onClick={(event) => handleTabClick(event, item.shortId)}
                sx={{
                  maxWidth: '100%',
                  cursor: 'grab',
                  ...(isSmallScreen
                    ? {}
                    : { borderBottom: `solid 1px ${theme.palette.divider}` }),
                  ...(isMultiSelected
                    ? { backgroundColor: theme.palette.action.selected }
                    : {}),
                }}
              />
            );
          })}
        </StyledTabs>
      )}
    </>
  );
};
