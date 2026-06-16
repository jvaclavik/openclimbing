import React from 'react';
import dynamic from 'next/dynamic';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlaceIcon from '@mui/icons-material/Place';
import { t } from '../../../../../services/intl';
import { useFeatureContext } from '../../../../utils/FeatureContext';
import {
  useCurrentItem,
  useEditContext,
  useExpandedSections,
} from '../../context/EditContext';
import {
  cragHasRouteMembers,
  findCragItemForRoutes,
} from '../../../Climbing/utils/cragRoutesItems';

const CragRoutesPositionMapDynamic = dynamic(
  () => import('../../../Climbing/CragRoutesPositionMap'),
  {
    ssr: false,
    loading: () => <div style={{ height: 500 }} />,
  },
);

const isRouteTag = (climbing: string | undefined) =>
  climbing === 'route' || climbing === 'route_bottom';

// True when the panel feature is a crag that actually has route members, so
// the shared crag map (with all route markers) makes sense for the current
// item — both for the crag itself and for an individual route being edited.
export const useHasCragRoutesMap = () => {
  const { feature } = useFeatureContext();
  const { items, current } = useEditContext();

  // Persisted OSM data already has route members.
  if (
    (feature?.memberFeatures ?? []).some((member) =>
      isRouteTag(member.tags?.climbing),
    )
  ) {
    return true;
  }

  // …or the current edit draft does (e.g. a brand-new sector with new routes).
  const cragItem = findCragItemForRoutes(items, current, feature);
  return cragHasRouteMembers(items, cragItem);
};

export const CragRoutesLocationEditor = () => {
  const { tags } = useCurrentItem();
  const { expanded, toggleExpanded } = useExpandedSections('location');
  const hasCragRoutesMap = useHasCragRoutesMap();

  const isCrag = tags.climbing === 'crag';
  const isRoute = isRouteTag(tags.climbing);

  if (!(isCrag || (isRoute && hasCragRoutesMap))) {
    return null;
  }

  return (
    <>
      <Divider />
      <Accordion
        disableGutters
        elevation={0}
        square
        expanded={expanded}
        onChange={toggleExpanded}
        slotProps={{ transition: { timeout: 0 } }}
        sx={{
          '&.MuiAccordion-root:before': {
            opacity: 0,
          },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" gap={1} alignItems="center">
            <PlaceIcon />
            <Typography variant="button">{t('editdialog.location')}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {expanded && <CragRoutesPositionMapDynamic />}
        </AccordionDetails>
      </Accordion>
    </>
  );
};
