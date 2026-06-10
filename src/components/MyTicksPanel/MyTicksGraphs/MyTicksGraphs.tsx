import { useState } from 'react';
import { RouteDistribution } from '../../FeaturePanel/Climbing/RouteDistribution';
import React from 'react';
import { FormControlLabel, Switch, Typography } from '@mui/material';
import { PanelSidePadding } from '../../utils/PanelHelpers';
import { OverpassFeature } from '../../../services/overpass/overpassSearch';
import { t } from '../../../services/intl';

type MyTicksGraphsProps = {
  features: OverpassFeature[];
};

export const MyTicksGraphs = ({ features }: MyTicksGraphsProps) => {
  const [isGrouped, setIsGrouped] = useState(true);
  if (features.length === 0) {
    return null;
  }

  return (
    <>
      <PanelSidePadding>
        <Typography variant="h6" mt={2}>
          {t('my_ticks.graphs.routes_distribution')}
        </Typography>
      </PanelSidePadding>
      <RouteDistribution
        features={features}
        cutEmptyMargins={!isGrouped}
        isGrouped={isGrouped}
      />
      <PanelSidePadding>
        <FormControlLabel
          control={
            <Switch
              checked={isGrouped}
              size="small"
              onChange={(e) => setIsGrouped(e.target.checked)}
            />
          }
          label={t('my_ticks.graphs.grouping')}
        />
      </PanelSidePadding>
    </>
  );
};
