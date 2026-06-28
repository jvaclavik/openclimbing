import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { t, Translation } from '../../../../../../services/intl';
import { getApiId } from '../../../../../../services/helpers';
import { fetchWays } from '../../../../../../services/osm/fetchWays';
import { OsmId } from '../../../../../../services/types';
import PlaceIcon from '@mui/icons-material/Place';
import {
  useCurrentItem,
  useExpandedSections,
} from '../../../context/EditContext';
import { OSM_WEBSITE } from '../../../../../../services/osm/consts';
import { useHasCragRoutesMap } from '../CragRoutesLocationEditor';
import { LocationInputs } from './LocationInputs';

const NotYetEditableWarning = () => {
  const { shortId } = useCurrentItem();
  const osmId = getApiId(shortId);
  const link = `${OSM_WEBSITE}/edit?${osmId.type}=${osmId.id}`;

  return (
    <Translation
      id="editdialog.location_editor_to_be_added"
      values={{ link }}
    />
  );
};

const useNodeEditableCheck = (osmId: OsmId) => {
  const isNew = osmId.id < 0;
  const [isNodeWithoutWay, setIsNodeWithoutWay] = useState(false);

  useEffect(() => {
    if (osmId.type === 'node' && !isNew) {
      // this is already cached from ParentsEditor
      fetchWays(osmId).then((waysOfNodes) =>
        setIsNodeWithoutWay(waysOfNodes.length === 0),
      );
    }
  }, [isNew, osmId]);

  return isNew || isNodeWithoutWay;
};

// The interactive map moved to the shared split-pane map (EditDialogMap); this
// section now just keeps the manual lat/lon inputs for editable nodes.
const Content = () => {
  const { shortId } = useCurrentItem();
  const osmId = getApiId(shortId);
  const isNodeEditable = useNodeEditableCheck(osmId);

  if (osmId.type === 'way') {
    return <NotYetEditableWarning />;
  }
  if (osmId.type !== 'node') {
    return null;
  }
  if (!isNodeEditable) {
    return <NotYetEditableWarning />;
  }
  return <LocationInputs key={shortId} />;
};

export const LocationEditor = () => {
  const { expanded, toggleExpanded } = useExpandedSections('location');
  const { shortId, tags } = useCurrentItem();
  const osmId = getApiId(shortId);
  const hasCragRoutesMap = useHasCragRoutesMap();
  const isRoute = tags.climbing === 'route' || tags.climbing === 'route_bottom';

  if (osmId.type === 'relation') {
    return null;
  }

  // Climbing routes inside a crag are positioned in the shared crag map
  // (CragRoutesLocationEditor), so skip the single-marker location editor.
  if (isRoute && hasCragRoutesMap) {
    return null;
  }

  return (
    <>
      <Divider />
      <Accordion // TODO replace Accordion with custom collapse component, it is not accordion anymore :)
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
        <AccordionDetails>{expanded && <Content />}</AccordionDetails>
      </Accordion>
    </>
  );
};
