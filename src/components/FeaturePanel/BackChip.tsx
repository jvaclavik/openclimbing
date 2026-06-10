import styled from '@emotion/styled';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Chip, Typography } from '@mui/material';
import Router, { useRouter } from 'next/router';
import { t } from '../../services/intl';

const DIARY_PATH_RE = /^\/u\//;

const labelFor = (target: string): string =>
  DIARY_PATH_RE.test(target) ? t('back.to_diary') : t('back.generic');

const BackItem = styled.div`
  margin: 12px 0 20px 0;

  a:hover {
    text-decoration: none;
  }
`;

/**
 * Renders a chip when the current URL contains a `?back=<path>` param.
 * Click navigates back to that path via the Next router (no full reload),
 * preserving the original query/hash captured by the caller.
 */
export const BackChip = () => {
  const router = useRouter();
  const back =
    typeof router.query.back === 'string' && router.query.back.length > 0
      ? router.query.back
      : null;
  if (!back) return null;

  const label = labelFor(back);

  return (
    <BackItem>
      <Typography component="h2" variant="subtitle2" color="primary">
        <Chip
          size="small"
          label={label}
          icon={<ArrowBackIcon fontSize="inherit" color="inherit" />}
          component="a"
          href={back}
          onClick={(e) => {
            e.preventDefault();
            Router.push(back);
          }}
          title={label}
        />
      </Typography>
    </BackItem>
  );
};
