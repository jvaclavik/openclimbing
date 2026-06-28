import styled from '@emotion/styled';
import DirectionsIcon from '@mui/icons-material/Directions';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { QuickActionButton } from './QuickActionButton';
import { SaveButton } from './SaveButton';
import Router from 'next/router';
import { ShareButton } from './ShareDialog/ShareButton';
import { t } from '../../../services/intl';
import { useFeatureContext } from '../../utils/FeatureContext';
import { isClimbingRelation } from '../../../utils';
import { getOsmappLink } from '../../../services/helpers';

const Wrapper = styled.div`
  max-width: 100%;
  width: fit-content;
  margin-top: 24px;

  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;

  /* Used to overwrite pointer-events: none from the collapsed featurepanel drawer */
  pointer-events: all;
`;

const Container = styled.div`
  width: max-content;
  display: flex;
  gap: 8px;
`;

export const QuickActions = () => {
  const { feature } = useFeatureContext();
  // Show PDF export for both crags and areas — area exports iterate over all
  // child crags and produce a combined PDF.
  //
  // While the feature is still a skeleton (loading), `tags` only holds the
  // name, so `isClimbingRelation` (which reads `tags.climbing`) is false. Fall
  // back to the vector-tile properties that the skeleton keeps, so the button
  // shows immediately and the user doesn't have to wait for the panel to
  // finish loading to re-open the PDF export. The climbing-tiles source
  // exposes the kind via `properties.type`, the legacy OSM POI source via
  // `properties.climbing`.
  const props = feature.properties;
  const isClimbingCragOrAreaByTile =
    feature.osmMeta?.type === 'relation' &&
    (props?.type === 'crag' ||
      props?.type === 'area' ||
      props?.climbing === 'crag' ||
      props?.climbing === 'area');
  const showPdfButton =
    isClimbingRelation(feature) || isClimbingCragOrAreaByTile;

  return (
    <Wrapper>
      <Container>
        <QuickActionButton
          icon={DirectionsIcon}
          label={t('featurepanel.directions_button')}
          onClick={() => {
            Router.push('/directions');
          }}
        />
        <SaveButton />
        <ShareButton />
        {showPdfButton && (
          <QuickActionButton
            icon={PictureAsPdfIcon}
            label={t('climbingpanel.pdf_export_button')}
            onClick={() => {
              // Shallow routing so the navigation doesn't re-run
              // `getInitialProps`/`getInitialFeature` (a full feature fetch)
              // before the route changes — otherwise the dialog can't mount
              // until that fetch resolves. The feature is already in context,
              // and the dialog shows a spinner while it finishes loading.
              Router.push(`${getOsmappLink(feature)}/climbing/pdf`, undefined, {
                shallow: true,
              });
            }}
          />
        )}
      </Container>
    </Wrapper>
  );
};
