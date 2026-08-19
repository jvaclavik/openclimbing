import styled from '@emotion/styled';
import { alpha, Theme } from '@mui/material';
import { tint } from '../../../utils/panelUi';

export const FilterBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px 14px;
`;

export const FilterSectionLabel = styled.div<{ $flush?: boolean }>`
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.58;
  margin-bottom: ${({ $flush }) => ($flush ? 0 : '8px')};
`;

export const FilterCard = styled.div`
  padding: 10px 12px 8px;
  border-radius: 12px;
  background: ${({ theme }) => tint(theme, 0.045)};
  border: 1px solid ${({ theme }) => tint(theme, 0.07)};
`;

export const FilterOption = styled.button<{ $selected?: boolean }>`
  appearance: none;
  font: inherit;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  color: inherit;
  font-size: 0.875rem;
  line-height: 1.35;
  font-weight: ${({ $selected }) => ($selected ? 800 : 600)};
  background: ${({ theme, $selected }) =>
    $selected ? alpha(theme.palette.primary.main, 0.16) : 'transparent'};
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.palette.primary.main : 'transparent'};
  transition:
    background 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: ${({ theme, $selected }) =>
      $selected ? alpha(theme.palette.primary.main, 0.22) : tint(theme, 0.06)};
  }
`;

export const filterSliderSx = {
  mt: 0.5,
  mb: 0.5,
  '& .MuiSlider-rail': {
    height: 6,
    borderRadius: 3,
    opacity: 0.24,
  },
  '& .MuiSlider-track': {
    height: 6,
    border: 'none',
    borderRadius: 3,
  },
  '& .MuiSlider-thumb': {
    width: 16,
    height: 16,
  },
} as const;

export const chipOutline = (theme: Theme) => ({
  borderColor: tint(theme, 0.22),
  color: 'text.primary' as const,
  bgcolor: tint(theme, 0.03),
  fontWeight: 600,
});

export const filterChipSx = (theme: Theme, outlined: boolean) => ({
  fontWeight: 600,
  borderRadius: '8px',
  '& .MuiTouchRipple-root': { display: 'none' },
  ...(outlined ? chipOutline(theme) : undefined),
});
