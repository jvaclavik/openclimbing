import styled from '@emotion/styled';
import RefreshIcon from '@mui/icons-material/Refresh';
import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import { t } from '../../../services/intl';
import { getDescription } from '../../../helpers/featureLabel';
import { tint } from '../../utils/panelUi';
import { EditQuickAction } from '../EditButton';
import {
  FeaturedLinkChips,
  isFeaturedLinkRenderer,
} from '../FeaturedLinkChips';
import { getFeaturedTagKeys } from '../getFeaturedTagKeys';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useReloadClimbingDialog } from './utils/useReloadClimbingDialog';

const HideOnNarrowPanel = styled.div`
  @container (max-width: 220px) {
    display: none;
  }
`;

const Wrap = styled.div`
  padding: 8px 16px 28px;
`;

const Card = styled.div`
  border-radius: 12px;
  padding: 16px 16px 12px;
  background-color: ${({ theme }) => tint(theme, 0.04)};
  border: 1px solid ${({ theme }) => tint(theme, 0.08)};
`;

const Description = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.65;
  white-space: pre-wrap;
`;

const Links = styled.div`
  margin-top: 14px;
`;

const Footer = styled.div<{ $withDivider: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  ${({ $withDivider, theme }) =>
    $withDivider
      ? `
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px solid ${tint(theme, 0.08)};
  `
      : ''}
`;

const ReloadButton = () => {
  const { reload, isReloading } = useReloadClimbingDialog();

  return (
    <Tooltip title={`${t('featurepanel.reload_fresh_data')} (Alt+R)`}>
      <span>
        <IconButton
          size="small"
          onClick={() => void reload()}
          disabled={isReloading}
          aria-label={t('featurepanel.reload_fresh_data')}
          sx={{ color: 'text.secondary' }}
        >
          {isReloading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <RefreshIcon fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export const ClimbingViewDetails = () => {
  const { feature } = useFeatureContext();
  const description = getDescription(feature);
  const hasLinks = getFeaturedTagKeys(feature).some(({ featuredKey }) =>
    isFeaturedLinkRenderer(featuredKey.renderer),
  );
  const hasContent = Boolean(description || hasLinks);

  return (
    <Wrap>
      <Card>
        {description ? (
          <HideOnNarrowPanel>
            <Description>{description}</Description>
          </HideOnNarrowPanel>
        ) : null}
        {hasLinks ? (
          <HideOnNarrowPanel>
            <Links>
              <FeaturedLinkChips />
            </Links>
          </HideOnNarrowPanel>
        ) : null}
        <Footer $withDivider={hasContent}>
          <EditQuickAction />
          <ReloadButton />
        </Footer>
      </Card>
    </Wrap>
  );
};
