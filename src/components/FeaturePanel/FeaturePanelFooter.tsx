import styled from '@emotion/styled';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import React from 'react';
import { t } from '../../services/intl';
import { Setter } from '../../types';
import { useToggleState } from '../helpers';
import { PanelFooterWrapper, PanelSidePadding } from '../utils/PanelHelpers';
import { useFeatureContext } from '../utils/FeatureContext';
import Coordinates from './Coordinates';
import {
  FeatureDescription,
  FromOsm,
  OpenInProduction,
} from './FeatureDescription';
import { ObjectsAround } from './ObjectsAround';

const OsmAccordion = styled(Accordion)`
  background: transparent;
  box-shadow: none;

  &:before {
    display: none;
  }
`;

const OsmSummary = styled(AccordionSummary)`
  min-height: 56px;
  padding: 0 16px;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};

  &.Mui-expanded {
    min-height: 56px;
  }

  .MuiAccordionSummary-content {
    margin: 10px 0;
    min-width: 0;

    &.Mui-expanded {
      margin: 10px 0;
    }
  }

  .MuiAccordionSummary-expandIconWrapper {
    color: ${({ theme }) => theme.palette.text.secondary};
  }
`;

type Props = {
  advanced: boolean;
  setAdvanced: Setter<boolean>;
  toggleShowTags: () => void;
  showTagsTable: boolean;
};

export const FeaturePanelFooter = ({
  advanced,
  setAdvanced,
  showTagsTable,
  toggleShowTags,
}: Props) => {
  const [showAround, toggleShowAround] = useToggleState(false);
  const { feature, reloadFeature, isReloading } = useFeatureContext();
  const { point, skeleton, deleted, nonOsmObject } = feature;

  const onClick = (e: React.MouseEvent) => {
    // Alt+Shift+click to enable FeaturePanel advanced mode
    if (e.shiftKey && e.altKey) {
      setAdvanced((v) => !v);
    }
  };

  return (
    <OsmAccordion disableGutters elevation={0} square onClick={onClick}>
      <OsmSummary expandIcon={<ExpandMoreIcon />}>
        <FeatureDescription />
      </OsmSummary>
      <AccordionDetails sx={{ px: 0, pt: 0, pb: 1 }}>
        <PanelFooterWrapper>
          <PanelSidePadding>
            {feature.point ? null : <FromOsm />}
            {point || nonOsmObject ? null : (
              <Box
                sx={{
                  mt: 2,
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  onClick={() => reloadFeature(true)}
                  disabled={isReloading}
                  startIcon={
                    isReloading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <RefreshIcon />
                    )
                  }
                >
                  {t('featurepanel.reload_fresh_data')}
                </Button>
              </Box>
            )}
            <Box
              sx={{
                mt: 3,
                mb: 1,
              }}
            >
              <Typography color="secondary">
                <label>
                  <input
                    type="checkbox"
                    onChange={toggleShowTags}
                    checked={showTagsTable}
                    disabled={
                      point || deleted || (!skeleton && !feature.schema)
                    }
                  />{' '}
                  {t('featurepanel.show_tags')}
                </label>
                <br />
                <label>
                  <input
                    type="checkbox"
                    onChange={toggleShowAround}
                    checked={showAround}
                  />{' '}
                  {t('featurepanel.show_objects_around')}
                </label>
                {showAround && <ObjectsAround advanced={advanced} />}
              </Typography>
            </Box>
            <Coordinates />
            <OpenInProduction />
          </PanelSidePadding>
        </PanelFooterWrapper>
      </AccordionDetails>
    </OsmAccordion>
  );
};
