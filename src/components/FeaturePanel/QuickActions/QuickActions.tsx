import { useState } from 'react';
import styled from '@emotion/styled';
import DirectionsIcon from '@mui/icons-material/Directions';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { QuickActionButton } from './QuickActionButton';
import { StarButton } from './StarButton';
import Router from 'next/router';
import { ShareButton } from './ShareDialog/ShareButton';
import { t } from '../../../services/intl';
import { useFeatureContext } from '../../utils/FeatureContext';
import { isClimbingCrag } from '../../../utils';
import { ClimbingPdfExportDialog } from '../Climbing/ClimbingPdfExportDialog';

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

const PdfExportButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <QuickActionButton
        icon={PictureAsPdfIcon}
        label={t('climbingpanel.pdf_export_button')}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && (
        <ClimbingPdfExportDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export const QuickActions = () => {
  const { feature } = useFeatureContext();
  const showPdfButton = isClimbingCrag(feature);

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
        <StarButton />
        <ShareButton />
        {showPdfButton && <PdfExportButton />}
      </Container>
    </Wrapper>
  );
};
