import React, { useEffect, useState } from 'react';
import { Box, Link, Tooltip } from '@mui/material';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import { getCommonsImageUrl } from '../../../../../services/images/getCommonsImageUrl';
import type { CommonsAllowedWidth } from '../../../../../services/images/getCommonsImageUrl';
import { getUrlForTag } from '../../../Properties/getUrlForTag';
import { t } from '../../../../../services/intl';
import { PathsOverlaySvg, PathWithTags } from '../../../FeatureImages/PathsSvg';
import { Size } from '../../../FeatureImages/types';

const WIKIMEDIA_COMMONS_UPLOAD_WIZARD_URL =
  'https://commons.wikimedia.org/wiki/Special:UploadWizard';

const THUMB_FETCH_WIDTH = 250 as CommonsAllowedWidth;
const THUMB_BOX_WIDTH = 168;
const THUMB_BOX_HEIGHT = 126;

const isValidFileThumb = (value: string) => {
  const regex = /^File:.+\.[a-zA-Z0-9_]+$/;
  return Boolean(value) && regex.test(value);
};

// Letterbox the photo inside the fixed thumb box, so the drawn lines – which
// are in relative photo coordinates – land where they belong. Cropping the
// photo (object-fit: cover) would shift them.
const fitIntoThumbBox = (ratio: number): Size =>
  ratio >= THUMB_BOX_WIDTH / THUMB_BOX_HEIGHT
    ? { width: THUMB_BOX_WIDTH, height: Math.round(THUMB_BOX_WIDTH / ratio) }
    : { width: Math.round(THUMB_BOX_HEIGHT * ratio), height: THUMB_BOX_HEIGHT };

const useImageRatio = (src: string | null) => {
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    setRatio(null);
  }, [src]);

  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setRatio(naturalWidth / naturalHeight);
    }
  };

  return { ratio, onLoad };
};

type ThumbImageProps = {
  src: string;
  paths: PathWithTags[];
};

const ThumbImage: React.FC<ThumbImageProps> = ({ src, paths }) => {
  const { ratio, onLoad } = useImageRatio(src);

  const img = (
    <Box
      component="img"
      src={src}
      alt=""
      onLoad={onLoad}
      sx={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: paths.length ? 'contain' : 'cover',
      }}
    />
  );

  if (!paths.length) {
    return img;
  }

  // until the photo is loaded we don't know where it sits inside the box
  const size = ratio == null ? null : fitIntoThumbBox(ratio);

  return (
    <Box
      sx={{
        position: 'relative',
        width: size ? size.width : '100%',
        height: size ? size.height : '100%',
        opacity: 0.9, // same slight dim as in the feature panel gallery
      }}
    >
      {img}
      {size && <PathsOverlaySvg paths={paths} size={size} />}
    </Box>
  );
};

type Props = {
  value: string;
  /** When provided and value is empty, clicking the placeholder calls this
   * handler instead of opening the Commons Upload Wizard. */
  onPlaceholderClick?: () => void;
  /** Route lines (`…:path` tags) drawn over the photo. */
  paths?: PathWithTags[];
};

const thumbBoxSx = {
  width: THUMB_BOX_WIDTH,
  height: THUMB_BOX_HEIGHT,
  flexShrink: 0,
  borderRadius: 1,
  overflow: 'hidden',
  bgcolor: 'action.hover',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

export const WikimediaCommonsThumb: React.FC<Props> = ({
  value,
  onPlaceholderClick,
  paths,
}) => {
  const trimmed = value.trim();
  const thumbUrl =
    value.startsWith('File:') && isValidFileThumb(value)
      ? getCommonsImageUrl(value, THUMB_FETCH_WIDTH)
      : null;

  const commonsHref = trimmed
    ? getUrlForTag('wikimedia_commons', trimmed)
    : null;

  const inner = thumbUrl ? (
    <ThumbImage src={thumbUrl} paths={paths ?? []} />
  ) : (
    <ImageOutlined color="disabled" sx={{ fontSize: 48 }} />
  );

  if (commonsHref) {
    return (
      <Link
        href={commonsHref}
        target="_blank"
        rel="noopener noreferrer"
        underline="none"
        sx={{
          ...thumbBoxSx,
          color: 'inherit',
          '&:hover': { opacity: 0.9 },
        }}
        aria-label={trimmed}
      >
        {inner}
      </Link>
    );
  }

  if (trimmed === '') {
    if (onPlaceholderClick) {
      return (
        <Tooltip
          arrow
          title={t('uploaddialog.row_upload_cta')}
          enterDelay={1000}
        >
          <Box
            onClick={onPlaceholderClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPlaceholderClick();
              }
            }}
            sx={{
              ...thumbBoxSx,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.selected' },
            }}
            aria-label={t('uploaddialog.row_upload_cta')}
          >
            {inner}
          </Box>
        </Tooltip>
      );
    }
    return (
      <Tooltip
        arrow
        title={t('editdialog.upload_photo_tooltip')}
        enterDelay={1000}
      >
        <Link
          href={WIKIMEDIA_COMMONS_UPLOAD_WIZARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          underline="none"
          sx={{
            ...thumbBoxSx,
            color: 'inherit',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.selected' },
          }}
          aria-label={t('editdialog.upload_photo')}
        >
          {inner}
        </Link>
      </Tooltip>
    );
  }

  return <Box sx={thumbBoxSx}>{inner}</Box>;
};
