import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { collectAreaImages, Gallery } from '../CragsInArea';
import { Feature, ImageDef } from '../../../services/types';

jest.mock('../FeatureImages/Image/Image', () => ({
  Image: ({ def }: { def: ImageDef & { v: string } }) => (
    <div data-testid="photo">{def.v}</div>
  ),
}));
jest.mock('../FeatureImages/FeatureImages', () => ({
  Slider: ({ children }) => <div>{children}</div>,
  Wrapper: ({ children }) => <div>{children}</div>,
}));

const feature = (name: string, photoCount: number, members = []) =>
  ({
    tags: { name },
    properties: {},
    osmMeta: { type: 'relation', id: 1 },
    imageDefs: Array.from({ length: photoCount }, (_, index) => ({
      type: 'tag',
      k: index ? `wikimedia_commons:${index + 1}` : 'wikimedia_commons',
      v: `File:${name}${index + 1}.jpg`,
      instant: true,
    })),
    memberFeatures: members,
  }) as unknown as Feature;

const photoNames = () =>
  screen.getAllByTestId('photo').map((photo) => photo.textContent);

// the app's custom palette colors the tile uses
const theme = createTheme({
  palette: { background: { elevation: '#ddd' } },
} as Parameters<typeof createTheme>[0]);

describe('crag card gallery', () => {
  it('shows a preview of each member first, the rest after it', () => {
    const area = feature('A', 4, [feature('B', 5), feature('C', 1)]);
    const { images, initialCount } = collectAreaImages(area);

    expect(images.map(({ def }) => (def as { v: string }).v)).toEqual([
      'File:A1.jpg',
      'File:A2.jpg',
      'File:A3.jpg',
      'File:B1.jpg',
      'File:B2.jpg',
      'File:B3.jpg',
      'File:C1.jpg',
      'File:A4.jpg',
      'File:B4.jpg',
      'File:B5.jpg',
    ]);
    expect(initialCount).toBe(7);
  });

  it('reveals the hidden photos without opening the crag', () => {
    const crag = feature('B', 15);
    const { images } = collectAreaImages(crag);
    const onCardClick = jest.fn();
    render(
      <ThemeProvider theme={theme}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div onClick={onCardClick}>
          <Gallery feature={crag} images={images} initialCount={3} />
        </div>
      </ThemeProvider>,
    );

    expect(photoNames()).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: /\+12/ }));

    expect(photoNames()).toHaveLength(13);
    expect(screen.getByRole('button', { name: /\+2/ })).toBeTruthy();
    expect(onCardClick).not.toHaveBeenCalled();
  });
});
