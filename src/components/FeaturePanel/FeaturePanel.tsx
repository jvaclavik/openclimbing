import styled from '@emotion/styled';
import { Box, Skeleton, Stack } from '@mui/material';
import React, { useState } from 'react';
import { getReactKey } from '../../services/helpers';
import { isPublictransportRoute } from '../../utils';
import { useMobileMode, useToggleState } from '../helpers';
import { useFeatureContext } from '../utils/FeatureContext';
import { PanelContent, PanelSidePadding } from '../utils/PanelHelpers';
import { BackChip } from './BackChip';
import { PanelClimbingBadges } from './Climbing/ClimbingBadges';
import { ClimbingRestriction } from './Climbing/ClimbingRestriction';
import { ClimbingStructuredData } from './Climbing/ClimbingStructuredData';
import { FeaturePanelClimbingGuideInfo } from './Climbing/FeaturePanelClimbingGuideInfo';
import { RouteDistributionInFeaturePanel } from './Climbing/RouteDistribution';
import { ClimbingRouteGrade } from './ClimbingRouteGrade';
import { CragsInArea } from './CragsInArea';
import { EditButton } from './EditButton';
import { EditDialog } from './EditDialog/EditDialog';
import { FeaturedTag } from './FeaturedTag';
import { FeatureHeading } from './FeatureHeading';
import { FeatureImages } from './FeatureImages/FeatureImages';
import { FeatureOpenPlaceGuideLink } from './FeatureOpenPlaceGuideLink';
import { FeaturePanelFooter } from './FeaturePanelFooter';
import { TestApiWarning } from './helpers/TestApiWarning';
import { MemberFeatures } from './MemberFeatures/MemberFeatures';
import { Members } from './Members';
import { OsmError } from './OsmError';
import { ParentLink } from './ParentLink';
import { Properties } from './Properties/Properties';
import { PublicTransport } from './PublicTransport/PublicTransport';
import { Runways } from './Runways/Runways';
import { Sockets } from './Sockets/Sockets';

const Flex = styled.div`
  flex: 1;
  margin-bottom: 40px;
`;

type FeaturePanelProps = {
  headingRef?: React.Ref<HTMLDivElement>;
};

export const FeaturePanel = ({ headingRef }: FeaturePanelProps) => {
  const { feature } = useFeatureContext();
  const [advanced, setAdvanced] = useState(false);
  const [showTags, toggleShowTags] = useToggleState(false);
  const isMobileMode = useMobileMode();

  const { tags, skeleton, deleted } = feature;
  const showTagsTable = deleted || showTags || (!skeleton && !feature.schema);

  if (!feature) {
    return null;
  }

  // ------------------------------------------------------------------------
  // Different components are shown for different types of features
  // Conditional components should have if(feature.tags.xxx) check at the beginning
  // All components should have margin-bottoms to accommodate missing parts
  // ------------------------------------------------------------------------

  const movePropertiesBelowMembers = tags.climbing === 'crag';
  const PropertiesComponent = () => (
    <Properties showTags={showTagsTable} key={getReactKey(feature)} />
  );

  return (
    <>
      <PanelContent>
        <PanelSidePadding>
          <BackChip />
          {!isMobileMode && <ParentLink />}

          <FeatureHeading ref={headingRef} />

          <ClimbingRestriction />

          <OsmError />
          <TestApiWarning />
          <FeaturedTag k="description" renderer="DescriptionRenderer" />
          <Stack spacing={1} alignItems="flex-start">
            <ClimbingRouteGrade />
            <PanelClimbingBadges />
          </Stack>
          {isMobileMode && <ParentLink />}
        </PanelSidePadding>

        <Flex>
          {skeleton ? (
            <PanelSidePadding>
              <Stack direction="column" spacing={1} alignItems="flex-start">
                <Skeleton variant="rounded" width="100%" height={14} />
                <Skeleton variant="rounded" width="100%" height={14} />
                <Skeleton variant="rounded" width={50} height={14} />
              </Stack>
            </PanelSidePadding>
          ) : (
            <>
              <CragsInArea />

              <Box mb={2}>
                <FeatureImages />
              </Box>

              <PanelSidePadding>
                {!movePropertiesBelowMembers && <PropertiesComponent />}
              </PanelSidePadding>
              <RouteDistributionInFeaturePanel />
              <PanelSidePadding>
                {!isPublictransportRoute(feature) && <MemberFeatures />}
                {advanced && <Members />}
                {movePropertiesBelowMembers && <PropertiesComponent />}
                <PublicTransport />
                <Runways />
                <Sockets />
                <FeatureOpenPlaceGuideLink />
                <EditButton />
                <EditDialog />
              </PanelSidePadding>
            </>
          )}
        </Flex>

        <FeaturePanelFooter
          advanced={advanced}
          setAdvanced={setAdvanced}
          showTagsTable={showTagsTable}
          toggleShowTags={toggleShowTags}
        />
        <FeaturePanelClimbingGuideInfo />
      </PanelContent>
      <ClimbingStructuredData />
    </>
  );
};
