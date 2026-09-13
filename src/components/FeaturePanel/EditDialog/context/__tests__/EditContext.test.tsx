import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { EditContextProvider, useEditContext } from '../EditContext';
import { addEmptyOriginalState } from '../itemsHelpers';
import { DataItem } from '../types';

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
  it('discards the edit session when the dialog transitions from open to closed', () => {
    mockOpened = true;
    const { result, rerender } = renderHook(() => useEditContext(), { wrapper });

    act(() => {
      result.current.addItem(initialItem);
      result.current.setCurrent('n1');
      result.current.setComment('some comment');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.current).toBe('n1');
    expect(result.current.comment).toBe('some comment');

    // Close the dialog – the whole edit session should be discarded.
    act(() => {
      mockOpened = false;
      rerender();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.current).toBe('');
    expect(result.current.comment).toBe('');
  });
});
