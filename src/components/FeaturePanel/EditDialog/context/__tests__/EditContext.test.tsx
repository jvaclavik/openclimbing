import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { EditContextProvider, useEditContext } from '../EditContext';
import { addEmptyOriginalState } from '../itemsHelpers';
import { DataItem } from '../types';
import { fetchParentFeatures } from '../../../../../services/osm/fetchParentFeatures';
import { fetchWays } from '../../../../../services/osm/fetchWays';

jest.mock('../../../../../services/osm/fetchParentFeatures', () => ({
  fetchParentFeatures: jest.fn(),
}));
jest.mock('../../../../../services/osm/fetchWays', () => ({
  fetchWays: jest.fn(),
}));

let mockOpened = true;
jest.mock('../../../helpers/EditDialogContext', () => ({
  useEditDialogContext: () => ({ opened: mockOpened }),
}));

const initialItem: DataItem = addEmptyOriginalState({
  shortId: 'n1',
  version: 1,
  tagsEntries: Object.entries({ amenity: 'cafe' }),
  toBeDeleted: false,
  nodeLonLat: [14, 50],
  sections: [],
});

const wrapper: React.FC = ({ children }) => (
  <EditContextProvider>{children}</EditContextProvider>
);

describe('EditContextProvider', () => {
  it.each([false, true])(
    'ignores a pending conversion after closing (reopened: %s)',
    async (reopened) => {
      jest.mocked(fetchParentFeatures).mockResolvedValue([]);
      let resolveWays: (ways: Awaited<ReturnType<typeof fetchWays>>) => void;
      jest.mocked(fetchWays).mockReturnValue(
        new Promise((resolve) => {
          resolveWays = resolve;
        }),
      );
      mockOpened = true;
      const { result, rerender } = renderHook(() => useEditContext(), {
        wrapper,
      });

      act(() => {
        result.current.addItem(initialItem);
      });
      const staleItem = result.current.items[0];
      const conversion = staleItem.convertToRelation();

      act(() => {
        mockOpened = false;
        rerender();
      });
      expect(result.current.items).toHaveLength(0);

      if (reopened) {
        act(() => {
          mockOpened = true;
          rerender();
        });
        act(() => {
          result.current.addItem({ ...initialItem, version: 2 });
          result.current.setCurrent('n1');
        });
      }
      const itemsBeforeCompletion = result.current.items;

      await act(async () => {
        resolveWays([]);
        await conversion;
        staleItem.setTag('name', 'Stale name');
      });

      expect(result.current.items).toBe(itemsBeforeCompletion);
      if (reopened) {
        expect(result.current.current).toBe('n1');
        act(() => {
          result.current.items[0].setTag('name', 'Fresh name');
        });
        expect(result.current.items[0].tags.name).toBe('Fresh name');
      }
    },
  );

  it('discards the edit session when the dialog transitions from open to closed', () => {
    mockOpened = true;
    const { result, rerender } = renderHook(() => useEditContext(), {
      wrapper,
    });

    act(() => {
      result.current.addItem(initialItem);
      result.current.setCurrent('n1');
      result.current.setComment('some comment');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.current).toBe('n1');
    expect(result.current.comment).toBe('some comment');
    const staleAddItem = result.current.addItem;
    const staleSetCurrent = result.current.setCurrent;

    // Close the dialog – the whole edit session should be discarded.
    act(() => {
      mockOpened = false;
      rerender();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.current).toBe('');
    expect(result.current.comment).toBe('');

    // Async continuations from the previous session must be ignored.
    act(() => {
      staleAddItem(initialItem);
      staleSetCurrent('n1');
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.current).toBe('');

    // New session updates should still work.
    act(() => {
      mockOpened = true;
      rerender();
      result.current.addItem(initialItem);
      result.current.setCurrent('n1');
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.current).toBe('n1');
  });
});
