import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import { useQuery } from 'react-query';
import { PanelLabel } from '../PanelLabel';
import { useFeatureContext } from '../../../utils/FeatureContext';
import { useTicksContext } from '../../../utils/TicksContext';
import { getShortId } from '../../../../services/helpers';
import { isFeatureClimbingRoute } from '../../../../utils';
import { PROJECT_ID } from '../../../../services/project';
import { t } from '../../../../services/intl';
import { fetchRouteTicks } from '../../../../services/my-ticks/myTicksApi';
import { TickSessionCard } from '../../../MyTicksPanel/TickSessionCard';
import { OthersRouteTickRow } from './OthersRouteTickRow';

const VISIBLE_COUNT = 5;

const OthersRouteTicksInner = () => {
  const { feature } = useFeatureContext();
  const { ticks: ownTicks } = useTicksContext();
  const [expanded, setExpanded] = useState(false);
  const { data } = useQuery(
    ['route-ticks', getShortId(feature.osmMeta)],
    () => fetchRouteTicks(feature.osmMeta),
    { staleTime: 60_000 },
  );

  // My own ticks are listed in "My ticks" just above. Match by tick id, not
  // by display name (that may be missing or stale).
  const ownTickIds = new Set((ownTicks ?? []).map((tick) => tick.id));
  const others = (data ?? []).filter((tick) => !ownTickIds.has(tick.id));
  if (others.length === 0) return null;

  const visible = expanded ? others : others.slice(0, VISIBLE_COUNT);
  const canExpand = others.length > VISIBLE_COUNT;

  return (
    <Box sx={{ mb: 2.5 }}>
      <PanelLabel
        addition={
          canExpand ? (
            <Button
              size="small"
              color="secondary"
              onClick={() => setExpanded((v) => !v)}
              sx={{ py: 0, minWidth: 0 }}
            >
              {expanded
                ? t('show_less')
                : t('route_ticks.show_all', { count: others.length })}
            </Button>
          ) : null
        }
      >
        {t('route_ticks.others_title')}
      </PanelLabel>
      <Box sx={{ mt: 1 }}>
        <TickSessionCard
          columns={['name', 'style', 'date']}
          nameLabel={t('route_ticks.climber')}
        >
          {visible.map((tick) => (
            <OthersRouteTickRow key={tick.id} tick={tick} />
          ))}
        </TickSessionCard>
      </Box>
    </Box>
  );
};

/** "Other climbers' ascents" in the route detail, with their notes. */
export const OthersRouteTicks = () => {
  const { feature } = useFeatureContext();
  if (!isFeatureClimbingRoute(feature) || PROJECT_ID !== 'openclimbing') {
    return null;
  }
  return <OthersRouteTicksInner />;
};
