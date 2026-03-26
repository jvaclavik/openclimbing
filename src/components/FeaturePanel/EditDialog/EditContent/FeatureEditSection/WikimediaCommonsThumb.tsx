import React from 'react';
import { Box, Link, Tooltip } from '@mui/material';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import { getCommonsImageUrl } from '../../../../../services/images/getCommonsImageUrl';
import type { CommonsAllowedWidth } from '../../../../../services/images/getCommonsImageUrl';
import { getUrlForTag } from '../../../Properties/getUrlForTag';
import { t } from '../../../../../services/intl';

const WIKIMEDIA_COMMONS_UPLOAD_WIZARD_URL =
  'https://commons.wikimedia.org/wiki/Special:UploadWizard';

const THUMB_FETCH_WIDTH = 250 as CommonsAllowedWidth;
const THUMB_BOX_WIDTH = 168;
const THUMB_BOX_HEIGHT = 126;

const isValidFileThumb = (value: string) => {
  const regex = /^File:.+\.[a-zA-Z0-9_]+$/;
  return Boolean(value) && regex.test(value);
};

type Props = { value: string };

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

export const WikimediaCommonsThumb: React.FC<Props> = ({ value }) => {
  const trimmed = value.trim();
  const thumbUrl =
    value.startsWith('File:') && isValidFileThumb(value)
      ? getCommonsImageUrl(value, THUMB_FETCH_WIDTH)
      : null;

  const commonsHref = trimmed
    ? getUrlForTag('wikimedia_commons', trimmed)
    : null;

  const inner = thumbUrl ? (
    <Box
      component="img"
      src={thumbUrl}
      alt=""
      sx={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
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
