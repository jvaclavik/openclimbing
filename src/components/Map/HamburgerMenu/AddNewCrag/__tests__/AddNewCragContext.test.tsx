import React from 'react';
import { act, render } from '@testing-library/react';
import { AddNewCragProvider, useAddNewCragContext } from '../AddNewCragContext';

const setFeature = jest.fn();
const open = jest.fn();
const close = jest.fn();
const getGlobalMap = jest.fn();

jest.mock('../../../../../services/mapStorage', () => ({
  getGlobalMap: () => getGlobalMap(),
}));

jest.mock('../../../../utils/FeatureContext', () => ({
  useFeatureContext: () => ({
    setFeature,
  }),
}));

jest.mock('../../../../FeaturePanel/helpers/EditDialogContext', () => ({
  useEditDialogContext: () => ({
    open,
    close,
    opened: false,
  }),
}));

jest.mock('../../../../utils/usePanelShown', () => ({
  usePanelShown: () => false,
}));

jest.mock('../../../../utils/getVisibleCenter', () => ({
  getVisibleCenter: () => [14.4, 50.1],
}));

jest.mock('../cragMarker', () => ({
  animateMarkerDrop: jest.fn(),
  createCragMarkerOptions: () => ({ element: document.createElement('div') }),
}));

jest.mock('maplibre-gl', () => ({
  Marker: class {
    lngLat = { lng: 14.4, lat: 50.1 };
    setLngLat() {
      return this;
    }
    addTo() {
      return this;
    }
    getLngLat() {
      return this.lngLat;
    }
    remove() {}
  },
}));

const Harness = () => {
  const ctx = useAddNewCragContext();
  return (
    <>
      <button onClick={() => ctx.start()}>start</button>
      <button onClick={() => ctx.confirm()}>confirm</button>
    </>
  );
};

describe('AddNewCragContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getGlobalMap.mockReturnValue({
      getZoom: () => 16,
    });
  });

  it('creates a new crag feature with sport=climbing preset tag', async () => {
    const { getByText } = render(
      <AddNewCragProvider>
        <Harness />
      </AddNewCragProvider>,
    );

    await act(async () => {
      getByText('start').click();
    });

    act(() => {
      getByText('confirm').click();
    });

    expect(setFeature).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: {
          climbing: 'crag',
          sport: 'climbing',
        },
      }),
    );
    expect(open).toHaveBeenCalled();
  });
});
