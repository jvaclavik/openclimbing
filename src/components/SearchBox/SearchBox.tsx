import React, { useRef, useState } from 'react';
import styled from '@emotion/styled';
import SearchIcon from '@mui/icons-material/Search';
import { CircularProgress, IconButton, Paper } from '@mui/material';
import { useRouter } from 'next/router';
import { AutocompleteInput } from './AutocompleteInput';
import { t } from '../../services/intl';
import { isDesktop, useMobileMode } from '../helpers';
import { SEARCH_BOX_HEIGHT } from './consts';
import { HamburgerMenu } from '../Map/HamburgerMenu/HamburgerMenu';
import { usePanelShown } from '../utils/usePanelShown';
import { FEATURE_PANEL_WIDTH } from '../utils/PanelHelpers';

const TopPanel = styled.div`
  position: absolute;
  height: ${SEARCH_BOX_HEIGHT}px;
  padding: 8px;
  box-sizing: border-box;

  top: 0;
  z-index: 1200; // 1100 is PanelWrapper

  width: 100%;
  @media ${isDesktop} {
    width: ${FEATURE_PANEL_WIDTH}px;
  }
`;

const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{ $withShadow: boolean }>`
  padding: 0 4px 0 0;
  display: flex;
  align-items: center;
  height: 36.5px;
  box-sizing: border-box;
  background-color: ${({ $withShadow, theme }) =>
    $withShadow
      ? theme.palette.background.searchInput
      : theme.palette.background.searchInputPanel};
  -webkit-backdrop-filter: blur(35px);
  backdrop-filter: blur(35px);
  transition: box-shadow 0s !important;
  box-shadow: ${({ $withShadow }) =>
    $withShadow ? '0 0 20px rgba(0, 0, 0, 0.4)' : 'none'} !important;

  .MuiAutocomplete-root {
    flex: 1;
    min-width: 0;
    height: 100%;
  }
`;

const SearchIconButton = styled(IconButton)`
  padding: 6px;
  svg {
    font-size: 20px;
    transform: scaleX(-1);
    filter: FlipH;
    -ms-filter: 'FlipH';
  }
`;

// https://docs.mapbox.com/help/troubleshooting/working-with-large-geojson-data/

type SearchFieldProps = {
  withShadow?: boolean;
  showHamburger?: boolean;
  autoFocus?: boolean;
};

/**
 * The bare search input (rounded Paper with autocomplete). It carries no
 * positioning so it can be dropped into the TopBar layout (or any flex slot).
 */
export const SearchField = ({
  withShadow = false,
  showHamburger = false,
  autoFocus = false,
}: SearchFieldProps) => {
  const isMobileMode = useMobileMode();
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteRef = useRef();

  return (
    <StyledPaper $withShadow={withShadow} elevation={1} ref={autocompleteRef}>
      <SearchIconButton disabled aria-label={t('searchbox.placeholder')}>
        <SearchIcon />
      </SearchIconButton>

      <AutocompleteInput
        autocompleteRef={autocompleteRef}
        setIsLoading={setIsLoading}
        autoFocus={autoFocus}
      />

      {isLoading && <CircularProgress size={16} sx={{ mx: 1 }} />}
      {showHamburger && isMobileMode && <HamburgerMenu />}
    </StyledPaper>
  );
};

const SearchBoxInner = ({ withoutPanel }) => {
  const isMobileMode = useMobileMode();

  return (
    <TopPanel>
      <SearchField withShadow={isMobileMode || withoutPanel} showHamburger />
    </TopPanel>
  );
};

export const SearchBox = () => {
  const isPanelShown = usePanelShown();

  const router = useRouter();
  if (router.asPath.startsWith('/directions')) {
    return null;
  }

  return <SearchBoxInner withoutPanel={!isPanelShown} />;
};
