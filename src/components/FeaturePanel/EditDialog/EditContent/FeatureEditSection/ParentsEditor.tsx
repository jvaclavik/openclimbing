import React, { useEffect } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  List,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getApiId, getShortId } from '../../../../../services/helpers';
import { FeatureRow } from '../FeatureRow';
import { t } from '../../../../../services/intl';
import {
  useCurrentItem,
  useEditContext,
  useExpandedSections,
} from '../../context/EditContext';
import { isClimbingRoute as getIsClimbingRoute } from '../../../../../utils';
import { AreaIcon } from '../../../Climbing/AreaIcon';
import { CragIcon } from '../../../Climbing/CragIcon';
import {
  useHandleItemClick,
  useHandleOpenAllParents,
} from '../useHandleItemClick';
import { Feature } from '../../../../../services/types';
import { OpenAllButton } from './helpers';
import { useGetParents } from './useGetParents';
import { fetchFreshItem } from '../../context/itemsHelpers';
import { findInItems } from '../../context/utils';
import { EditTabDropZone } from './EditTabDropZone';
import { useLinkEditItem } from './useLinkEditItem';
import { AddParentForm } from './AddParentForm';

const SectionName = () => {
  const theme = useTheme();
  const { tags } = useCurrentItem();

  const isClimbingCrag = tags.climbing === 'crag';
  const isClimbingRoute = getIsClimbingRoute(tags);

  if (isClimbingCrag) {
    return (
      <Stack
        direction="row"
        sx={{
          gap: 1,
        }}
      >
        <AreaIcon
          fill={theme.palette.text.primary}
          stroke={theme.palette.text.primary}
          height={24}
          width={24}
        />
        <Typography variant="button">
          {t('editdialog.climbing_areas')}
        </Typography>
      </Stack>
    );
  }
  if (isClimbingRoute) {
    return (
      <Stack
        direction="row"
        sx={{
          gap: 1,
        }}
      >
        <CragIcon
          fill={theme.palette.text.primary}
          stroke={theme.palette.text.primary}
          height={24}
          width={24}
        />
        <Typography variant="button">
          {t('editdialog.climbing_crags')}
        </Typography>
      </Stack>
    );
  }
  return <Typography variant="button">{t('editdialog.parents')}</Typography>;
};

const getLabel = (parent: Feature) => {
  const shortId = getShortId(parent.osmMeta);
  return parent.tags?.name || parent.schema?.label || shortId;
};

const CustomAccordion = ({
  children,
  parentsLength,
}: {
  children: React.ReactNode;
  parentsLength: number;
}) => {
  const { tags } = useCurrentItem();
  const { current } = useEditContext();
  const { expanded, toggleExpanded, expand } = useExpandedSections('parents');

  useEffect(() => {
    if (tags.climbing === 'crag') return;
    expand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    <Accordion // TODO replace Accordion with custom collapse component, it is not accordion anymore :)
      disableGutters
      elevation={0}
      square
      expanded={expanded}
      slotProps={{ transition: { timeout: 0 } }}
      sx={{
        bgcolor: 'transparent',
        '&.MuiAccordion-root:before': {
          opacity: 0,
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1-content"
        id="panel1-parents-header"
        onClick={toggleExpanded}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
          }}
        >
          <SectionName />
          {parentsLength ? (
            <Chip size="small" label={parentsLength} variant="outlined" />
          ) : null}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
};

const useVisibleParents = () => {
  const parents = useGetParents();
  const { items, current } = useEditContext();

  const visibleOsmParents = parents.filter((parent) => {
    const parentItem = findInItems(items, getShortId(parent.osmMeta));
    if (!parentItem?.members) return true;
    return parentItem.members.some((member) => member.shortId === current);
  });

  const osmParentIds = new Set(
    visibleOsmParents.map((parent) => getShortId(parent.osmMeta)),
  );

  const sessionParents = items.filter(
    (item) =>
      item.shortId !== current &&
      item.shortId.startsWith('r') &&
      !osmParentIds.has(item.shortId) &&
      item.members?.some((member) => member.shortId === current),
  );

  return { visibleOsmParents, sessionParents };
};

export const ParentsEditor = () => {
  const handleClick = useHandleItemClick();
  const { visibleOsmParents, sessionParents } = useVisibleParents();
  const handleOpenAll = useHandleOpenAllParents(visibleOsmParents);
  const { items, addItem, current } = useEditContext();
  const { addAsParent } = useLinkEditItem();
  const { expand } = useExpandedSections('parents');

  const unlinkFromParent = async (parentShortId: string) => {
    const existing = findInItems(items, parentShortId);
    if (existing) {
      existing.setMembers((prev) =>
        (prev ?? []).filter((member) => member.shortId !== current),
      );
      return;
    }
    const fresh = await fetchFreshItem(getApiId(parentShortId));
    addItem({
      ...fresh,
      members: (fresh.members ?? []).filter(
        (member) => member.shortId !== current,
      ),
    });
  };

  const parentsCount = visibleOsmParents.length + sessionParents.length;

  return (
    <EditTabDropZone
      onDropShortId={async (droppedShortId) => {
        const added = await addAsParent(droppedShortId);
        if (added) expand();
      }}
    >
      <CustomAccordion parentsLength={parentsCount}>
        <List disablePadding>
          {visibleOsmParents.map((parent) => {
            const shortId = getShortId(parent.osmMeta);
            const canRemove = parent.osmMeta.type === 'relation';
            return (
              <FeatureRow
                key={shortId}
                shortId={shortId}
                originalLabel={getLabel(parent)}
                previewTags={parent.tags}
                onClick={(e) => handleClick(e, shortId)}
                onRemove={
                  canRemove ? () => unlinkFromParent(shortId) : undefined
                }
              />
            );
          })}
          {sessionParents.map((parent) => (
            <FeatureRow
              key={parent.shortId}
              shortId={parent.shortId}
              originalLabel={parent.tags.name || parent.presetLabel}
              previewTags={parent.tags}
              onClick={(e) => handleClick(e, parent.shortId)}
              onRemove={() => unlinkFromParent(parent.shortId)}
            />
          ))}
        </List>

        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            mt: 1,
            ml: 1,
          }}
        >
          <AddParentForm />
          <Box sx={{ flex: 1 }} />
          {visibleOsmParents.length > 1 && (
            <OpenAllButton onClick={handleOpenAll} />
          )}
        </Stack>
      </CustomAccordion>
    </EditTabDropZone>
  );
};
