import styled from '@emotion/styled';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TuneIcon from '@mui/icons-material/Tune';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { getLabel } from '../../../helpers/featureLabel';
import { getCommonsImageUrl } from '../../../services/images/getCommonsImageUrl';
import { t } from '../../../services/intl';
import { useMobileMode } from '../../helpers';
import { UserSettingsDialog } from '../../HomepagePanel/UserSettingsDialog';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useEditDialogContext } from '../helpers/EditDialogContext';
import { ClimbingPdfExportDialog } from './ClimbingPdfExportDialog';
import { useClimbingContext } from './contexts/ClimbingContext';
import {
  getNextWikimediaCommonsIndex,
  getWikimediaCommonsKey,
} from './utils/photo';
import { usePhotoChange } from './utils/usePhotoChange';
import { OfflineBadge } from '../../App/OfflineBadge';

const Title = styled.div`
  flex: 1;
  overflow: hidden;
`;

const PhotosContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
`;

const PhotoGallery = styled.div`
  display: flex;
  flex-direction: row;
  /* No gap so adjacent thumbnails share an edge — keeps hover continuous
     and avoids a flicker zone when sweeping the mouse between them. */
  gap: 2px;
  overflow-x: auto;
  padding-bottom: 4px;
  /* keep thumbnails compact and let the row scroll horizontally if needed */
  scrollbar-width: thin;
`;

const PhotoThumbnailButton = styled.button<{ $isCurrentPhoto: boolean }>`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  /* Fixed height; width grows with the image's natural aspect ratio. */
  height: 40px;
  width: auto;
  padding: 0;
  border: 2px solid
    ${({ $isCurrentPhoto, theme }) =>
      $isCurrentPhoto ? theme.palette.primary.main : 'transparent'};
  border-radius: 4px;
  background: ${({ theme }) => theme.palette.action.hover};
  cursor: pointer;
  overflow: hidden;
  transition:
    opacity 0.12s ease,
    border-color 0.12s ease;

  &:hover {
    opacity: ${({ $isCurrentPhoto }) => ($isCurrentPhoto ? 1 : 0.85)};
  }
`;

const PhotoThumbnailImage = styled.img`
  height: 100%;
  width: auto;
  display: block;
`;

const AddPhotoPlaceholderButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 40px;
  width: 56px;
  padding: 0;
  margin-left: 2px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: ${({ theme }) => theme.palette.text.secondary};
  cursor: pointer;
  transition:
    border-color 0.12s ease,
    color 0.12s ease,
    background 0.12s ease;

  &:hover {
    color: ${({ theme }) => theme.palette.primary.main};
    background: ${({ theme }) => theme.palette.action.hover};
  }
`;

const PhotoIndexBadge = styled.span`
  position: absolute;
  top: 2px;
  left: 2px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 14px;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 3px;
  pointer-events: none;
`;

const TooltipPreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 260px;
`;

const TooltipPreviewImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  border-radius: 2px;
`;

const TooltipPreviewCaption = styled.span`
  font-size: 11px;
  line-height: 14px;
  word-break: break-word;
`;

type PhotoThumbnailProps = {
  photo: string;
  index: number;
  isCurrentPhoto: boolean;
  onClick: () => void;
};

const PhotoThumbnail = ({
  photo,
  index,
  isCurrentPhoto,
  onClick,
}: PhotoThumbnailProps) => {
  const isMobileMode = useMobileMode();
  // Use widths from the offline set (250, 500) so the header thumbnails resolve
  // from cache when offline instead of requesting an uncached 120/… variant.
  const thumbUrl = getCommonsImageUrl(`File:${photo}`, 250);
  const previewUrl = getCommonsImageUrl(`File:${photo}`, 500);

  const button = (
    <PhotoThumbnailButton
      type="button"
      $isCurrentPhoto={isCurrentPhoto}
      onClick={onClick}
      aria-current={isCurrentPhoto ? 'true' : undefined}
      aria-label={`Show photo ${index + 1}`}
    >
      {thumbUrl && <PhotoThumbnailImage src={thumbUrl} alt="" loading="lazy" />}
    </PhotoThumbnailButton>
  );

  if (isMobileMode) {
    return button;
  }

  return (
    <Tooltip
      title={
        <TooltipPreview>
          {previewUrl && (
            <TooltipPreviewImage src={previewUrl} alt="" loading="lazy" />
          )}
          <TooltipPreviewCaption>
            {`Photo ${index + 1} — ${photo}`}
          </TooltipPreviewCaption>
        </TooltipPreview>
      }
      enterDelay={2000}
      enterNextDelay={60}
      leaveDelay={120}
      slotProps={{
        popper: {
          modifiers: [{ name: 'offset', options: { offset: [0, 0] } }],
        },
      }}
    >
      {button}
    </Tooltip>
  );
};

export const ClimbingCragDialogHeader = ({ onClose }) => {
  const [isUserSettingsOpened, setIsUserSettingsOpened] =
    useState<boolean>(false);
  const [isPdfExportOpen, setIsPdfExportOpen] = useState<boolean>(false);
  const { photoPath, photoPaths, isEditMode } = useClimbingContext();
  const { openWithTag } = useEditDialogContext();

  const { feature } = useFeatureContext();
  const onPhotoChange = usePhotoChange();

  const label = getLabel(feature);

  const handleAddPhoto = () => {
    const nextKey = getWikimediaCommonsKey(
      getNextWikimediaCommonsIndex(feature.tags),
    );
    openWithTag(nextKey);
  };

  return (
    <AppBar position="static" color="transparent">
      <Toolbar variant="dense">
        <Title>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              noWrap
              variant="h5"
              component="div"
              fontFamily={'Piazzolla'}
            >
              {label}
            </Typography>
            <OfflineBadge />
          </Box>
          {(photoPaths?.length > 1 ||
            (isEditMode && photoPaths?.length >= 1)) && (
            <PhotosContainer>
              <PhotoGallery>
                {photoPaths.map((photo, index) => (
                  <PhotoThumbnail
                    key={photo}
                    photo={photo}
                    index={index}
                    isCurrentPhoto={photo === photoPath}
                    onClick={() => onPhotoChange(photo)}
                  />
                ))}
                {isEditMode && (
                  <Tooltip title={t('climbingpanel.add_photo_tooltip')}>
                    <AddPhotoPlaceholderButton
                      type="button"
                      onClick={handleAddPhoto}
                      aria-label={t('climbingpanel.add_photo_tooltip')}
                    >
                      <AddPhotoAlternateIcon fontSize="small" />
                    </AddPhotoPlaceholderButton>
                  </Tooltip>
                )}
              </PhotoGallery>
            </PhotosContainer>
          )}
        </Title>

        <Box mr={1}>
          <Tooltip title={t('climbingpanel.pdf_export_button')}>
            <IconButton
              color="primary"
              edge="end"
              onClick={() => setIsPdfExportOpen(true)}
            >
              <PictureAsPdfIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box mr={2}>
          <Tooltip title="Show settings">
            <IconButton
              color="primary"
              edge="end"
              onClick={() => {
                setIsUserSettingsOpened(!isUserSettingsOpened);
              }}
            >
              <TuneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Tooltip title="Close crag detail">
          <IconButton color="primary" edge="end" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <UserSettingsDialog
        isOpened={isUserSettingsOpened}
        onClose={() => setIsUserSettingsOpened(false)}
      />
      {isPdfExportOpen && (
        <ClimbingPdfExportDialog
          isOpen={isPdfExportOpen}
          onClose={() => setIsPdfExportOpen(false)}
        />
      )}
    </AppBar>
  );
};
