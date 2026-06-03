import styled from '@emotion/styled';
import { Paper, PaperProps, Popper, PopperProps } from '@mui/material';
import { useFeatureContext } from '../utils/FeatureContext';
import { extraPalette } from '../../helpers/extraPalette';

const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<PaperProps & { $solidBg: boolean }>`
  background-color: ${({ theme, $solidBg }) =>
    $solidBg
      ? extraPalette[theme.palette.mode].searchInputSolid
      : extraPalette[theme.palette.mode].searchInput};
  -webkit-backdrop-filter: blur(35px);
  backdrop-filter: blur(35px);
`;

export const OptionsPaper = (props: PaperProps) => {
  const { feature } = useFeatureContext();
  return <StyledPaper {...props} $solidBg={!!feature} />;
};

// eslint-disable-next-line local-rules/no-styled-missing-transient-props
export const OptionsPopper = styled(Popper)<PopperProps>`
  padding-top: 5px;
`;
