import React from 'react';
import Router from 'next/router';
import styled from '@emotion/styled';
import { Fab, Zoom } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { t } from '../../../services/intl';
import { getOsmappLink } from '../../../services/helpers';
import { useFeatureContext } from '../../utils/FeatureContext';
import { isClimbingCrag } from '../../../utils';
import { useEditDialogContext } from '../helpers/EditDialogContext';

// Sticks to the bottom of the scroll viewport (works both in the desktop
// scrollbars and the mobile drawer). The zero-height wrapper keeps the FAB
// floating above the content without taking up layout space.
const StickyAnchor = styled.div`
  position: sticky;
  bottom: 0;
  height: 0;
  z-index: 1200;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
`;

const FabPositioner = styled.div`
  pointer-events: auto;
  transform: translateY(-72px);
  padding-right: 16px;
`;

export const ClimbingGuideFab = () => {
  const { feature } = useFeatureContext();
  const { opened } = useEditDialogContext();

  if (!isClimbingCrag(feature)) {
    return null;
  }

  const label = t('featurepanel.show_climbing_guide');
  const onClick = () => {
    Router.push(`${getOsmappLink(feature)}/climbing${window.location.hash}`);
  };

  return (
    <StickyAnchor>
      <FabPositioner>
        <Zoom in={!opened}>
          <Fab
            variant="extended"
            color="primary"
            aria-label={label}
            onClick={onClick}
          >
            <AutoStoriesIcon sx={{ mr: 1 }} />
            {label}
          </Fab>
        </Zoom>
      </FabPositioner>
    </StickyAnchor>
  );
};
