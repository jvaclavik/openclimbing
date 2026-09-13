jest.mock('../../../services/intl', () => ({ t: (key: string) => key }));

import { searchInputSx } from '../renderInputFactory';

// Guards the iOS Safari auto-zoom fix (#209): iOS zooms the whole page in when
// a focused input's font-size is below 16px, and the map's pinch-zoom then
// traps the user at that zoom level with no way back out.
describe('search input font-size (iOS zoom prevention)', () => {
  const touchMedia = '@media (hover: none) and (pointer: coarse)';

  it('renders at >= 16px on touch devices so iOS Safari does not auto-zoom', () => {
    expect(searchInputSx[touchMedia].fontSize).toBeGreaterThanOrEqual(16);
  });

  it('keeps the compact 14px size on pointer (desktop) devices', () => {
    expect(searchInputSx.fontSize).toBe(14);
  });
});
