import React from 'react';
import Router from 'next/router';
import { Button, Typography } from '@mui/material';
import Link from 'next/link';
import { t } from '../../services/intl';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';
import { ClientOnly } from '../helpers';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { TickScoringStylesTable } from './TickScoringStylesTable';

export const TickScoringPanel = () => {
  const handleClose = () => {
    Router.push(`/`);
  };

  return (
    <ClientOnly>
      <MobilePageDrawer className="my-ticks-drawer">
        <PanelContent>
          <PanelScrollbars>
            <ClosePanelButton right onClick={handleClose} />
            <PanelSidePadding>
              <Typography variant="h4" component="h1" gutterBottom>
                {t('tick_scoring.page_title')}
              </Typography>
              <Typography variant="body1" paragraph sx={{ maxWidth: 720 }}>
                {t('tick_scoring.intro')}
              </Typography>

              <Button
                component={Link}
                href="/climbing-grades"
                variant="outlined"
                sx={{ mb: 2 }}
              >
                {t('tick_scoring.open_grade_table')}
              </Button>

              <TickScoringStylesTable />

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t('tick_scoring.footer_note')}
              </Typography>
            </PanelSidePadding>
          </PanelScrollbars>
        </PanelContent>
      </MobilePageDrawer>
    </ClientOnly>
  );
};
