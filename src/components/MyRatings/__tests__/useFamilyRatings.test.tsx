import { act, renderHook, waitFor } from '@testing-library/react';
import { useFamilyRatings } from '../useFamilyRatings';
import type { TourRating } from '../../../services/tours/ratings';

const id = '241ca1fa-7cb5-4b5d-8a13-9da8fae95ac4';
jest.mock('next/router', () => ({
  useRouter: () => ({ query: { tour: id } }),
}));

test('loads both family ratings from the server, updates Simon and keeps Mama unchanged', async () => {
  const original = global.fetch;
  const rows: TourRating[] = [
    {
      tour_id: id,
      profile: 'Mama',
      stars: 5,
      visited: true,
      visited_at: null,
      note: 'Schön',
    },
    {
      tour_id: id,
      profile: 'Simon',
      stars: 4,
      visited: false,
      visited_at: null,
      note: '',
    },
  ];
  const fetchMock = jest.fn(async (url: string, options?: RequestInit) => {
    if (options?.method === 'PUT')
      return { ok: true, json: async () => ({ saved: true }) };
    return {
      ok: true,
      json: async () =>
        url.includes('?tour=')
          ? { tour: { id, name: 'Norissteig' }, ratings: rows }
          : { tours: [{ id, name: 'Norissteig' }], next: null },
    };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  try {
    const { result, unmount } = renderHook(() => useFamilyRatings());
    await waitFor(() => expect(result.current.currentTour?.id).toBe(id));
    expect(result.current.average).toBe(4.5);
    act(() => result.current.setStars(3));
    await act(async () => result.current.save());
    expect(result.current.average).toBe(4);
    expect(
      result.current.ratings.find((r) => r.profile === 'Mama')?.stars,
    ).toBe(5);
    const write = fetchMock.mock.calls.find(
      (call) => call[1]?.method === 'PUT',
    );
    expect(JSON.parse(String(write?.[1]?.body))).toMatchObject({
      tour_id: id,
      profile: 'Simon',
      stars: 3,
    });
    act(() => result.current.setProfile('Mama'));
    expect(result.current.note).toBe('Schön');
    unmount();
  } finally {
    global.fetch = original;
  }
});
