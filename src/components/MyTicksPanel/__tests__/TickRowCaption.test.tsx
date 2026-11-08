import React from 'react';
import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { TickRowCaption } from '../TickRowCaption';

const renderCaption = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

describe('TickRowCaption', () => {
  it('shows crag, partners and the note for other climbers', () => {
    renderCaption(
      <TickRowCaption
        cragName="Holštejn"
        partners="s @pepa"
        note="Mokrý klíčový krok"
      />,
    );
    expect(screen.getByText(/Holštejn/)).toBeTruthy();
    expect(screen.getByText('@pepa')).toBeTruthy();
    expect(screen.getByText('Mokrý klíčový krok')).toBeTruthy();
  });

  it('renders nothing without content', () => {
    const { container } = renderCaption(<TickRowCaption note="  " />);
    expect(container.innerHTML).toBe('');
  });
});
