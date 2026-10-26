import React from 'react';
import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { intl } from '../../../../services/intl';
import { BoltCount, parseBoltCount } from '../BoltCount';

describe('parseBoltCount', () => {
  it('parses the climbing:bolts tag', () => {
    expect(parseBoltCount({ 'climbing:bolts': '12' })).toBe(12);
    expect(parseBoltCount({ 'climbing:bolts': ' 3 ' })).toBe(3);
    expect(parseBoltCount({ 'climbing:bolts': '0' })).toBe(0);
  });

  it('returns null for missing or non-numeric values', () => {
    expect(parseBoltCount({})).toBe(null);
    expect(parseBoltCount()).toBe(null);
    expect(parseBoltCount({ 'climbing:bolts': '' })).toBe(null);
    expect(parseBoltCount({ 'climbing:bolts': 'yes' })).toBe(null);
    expect(parseBoltCount({ 'climbing:bolts': '5-6' })).toBe(null);
  });
});

describe('BoltCount', () => {
  beforeAll(() => {
    intl.messages = {
      ...intl.messages,
      'climbing_bolts.label': 'Number of bolts',
    };
  });

  const renderWithTheme = (ui: React.ReactElement) =>
    render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

  it('renders the number of bolts', () => {
    renderWithTheme(<BoltCount tags={{ 'climbing:bolts': '7' }} />);

    expect(screen.getByLabelText('Number of bolts: 7').textContent).toBe('7');
  });

  it('renders nothing without a parsable climbing:bolts tag', () => {
    const { container } = renderWithTheme(
      <BoltCount tags={{ 'climbing:length': '20' }} />,
    );

    expect(container.innerHTML).toBe('');
  });
});
