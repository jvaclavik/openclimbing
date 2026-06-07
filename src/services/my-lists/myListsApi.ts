import { fetchJson } from '../fetch';
import { UserList, UserListItem } from './myListsTypes';

export const fetchMyLists = async (): Promise<UserList[]> =>
  fetchJson<UserList[]>('/api/my-lists', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    nocache: true,
  });

export const createMyList = async (params: {
  name: string;
  emoji: string;
  color: string;
}): Promise<{ id: number }> =>
  fetchJson<{ id: number }>('/api/my-lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

export const updateMyList = async (
  id: number,
  patch: { name?: string; emoji?: string; color?: string },
): Promise<void> => {
  await fetchJson(`/api/my-lists/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
};

export const deleteMyList = async (id: number): Promise<void> => {
  await fetchJson(`/api/my-lists/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
};

export const addMyListItem = async (
  listId: number,
  item: Omit<UserListItem, 'addedAt'>,
): Promise<void> => {
  const [lon, lat] = item.center;
  await fetchJson(`/api/my-lists/${listId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shortId: item.shortId,
      label: item.label,
      poiType: item.poiType,
      lon,
      lat,
    }),
  });
};

export const removeMyListItem = async (
  listId: number,
  shortId: string,
): Promise<void> => {
  await fetchJson(
    `/api/my-lists/${listId}/items/${encodeURIComponent(shortId)}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
