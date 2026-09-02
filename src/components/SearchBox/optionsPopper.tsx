import styled from '@emotion/styled';
import { Paper, PaperProps, Popper, PopperProps } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { isMobileMode } from '../helpers';
import { useFeatureContext } from '../utils/FeatureContext';

const EDGE_GUTTER = 6;

const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<PaperProps & { $solidBg: boolean }>`
  overflow: hidden;
  border-radius: 14px;
  background-color: ${({ theme, $solidBg }) =>
    $solidBg
      ? theme.palette.background.searchInputSolid
      : theme.palette.background.searchInput};
  -webkit-backdrop-filter: blur(35px);
  backdrop-filter: blur(35px);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.18),
    0 0 0 1px
      ${({ theme }) =>
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.06)'};

  .MuiAutocomplete-listbox {
    padding: 6px;
  }

  .MuiAutocomplete-option {
    padding: 8px 10px;
    margin: 1px 0;
    border-radius: 10px;
    min-height: 52px;
    align-items: center;
    column-gap: 10px;

    &[aria-selected='true'] {
      background-color: transparent;
    }

    &.Mui-focused {
      background-color: ${({ theme }) =>
        alpha(
          theme.palette.primary.main,
          theme.palette.mode === 'dark' ? 0.18 : 0.1,
        )};
    }
  }
`;

export const OptionsPaper = (props: PaperProps) => {
  const { feature } = useFeatureContext();
  return <StyledPaper {...props} $solidBg={!!feature} />;
};

// eslint-disable-next-line local-rules/no-styled-missing-transient-props
const StyledPopper = styled(Popper)`
  padding-top: 8px;

  @media ${isMobileMode} {
    left: ${EDGE_GUTTER}px !important;
    width: calc(100vw - ${EDGE_GUTTER * 2}px) !important;
  }
`;

export const OptionsPopper = (props: PopperProps) => {
  const rawWidth = props.style?.width;
  const anchorWidth =
    typeof rawWidth === 'number'
      ? rawWidth
      : parseFloat(String(rawWidth || 0)) || 0;
  const maxWidth =
    typeof window === 'undefined' ? 420 : window.innerWidth - EDGE_GUTTER * 2;

  return (
    <StyledPopper
      {...props} // eslint-disable-line react/jsx-props-no-spreading
      style={{
        ...props.style,
        width: Math.min(Math.max(anchorWidth, 400), maxWidth),
      }}
    />
  );
};
