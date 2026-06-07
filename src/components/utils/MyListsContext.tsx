import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  addMyListItem,
  createMyList,
  deleteMyList,
  fetchMyLists,
  removeMyListItem,
  updateMyList,
} from '../../services/my-lists/myListsApi';
import { UserList, UserListItem } from '../../services/my-lists/myListsTypes';
import { pickNextListColor } from '../../services/my-lists/listColors';
import { useOsmAuthContext } from './OsmAuthContext';
import { usePersistedState } from './usePersistedState';

const QUERY_KEY = ['my-lists'];

type MyListsContextType = {
  lists: UserList[] | null;
  isLoading: boolean;
  isInAnyList: (shortId: string) => boolean;
  listsContaining: (shortId: string) => UserList[];

  addToList: (
    listId: number,
    item: Omit<UserListItem, 'addedAt'>,
  ) => Promise<void>;
  removeFromList: (listId: number, shortId: string) => Promise<void>;
  createList: (name: string, emoji: string, color?: string) => Promise<number>;
  updateList: (
    id: number,
    patch: { name?: string; emoji?: string; color?: string },
  ) => Promise<void>;
  deleteList: (id: number) => Promise<void>;

  lastUsedListId: number | null;
  setLastUsedListId: (id: number | null) => void;

  visibleListIds: number[];
  setVisibleListIds: (
    ids: number[] | ((current: number[]) => number[]),
  ) => void;
  toggleListVisibility: (id: number) => void;
};

const MyListsContext = createContext<MyListsContextType | undefined>(undefined);

const useListsQuery = (loggedIn: boolean) => {
  const { data, isFetching, isFetched } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchMyLists,
    enabled: loggedIn,
    keepPreviousData: true,
  });

  const lists: UserList[] | null = !loggedIn
    ? []
    : !isFetched
      ? null
      : (data ?? []);

  return { lists, isFetching };
};

const useListsMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = useCallback(
    () => queryClient.invalidateQueries(QUERY_KEY),
    [queryClient],
  );

  const addItem = useMutation(
    (vars: { listId: number; item: Omit<UserListItem, 'addedAt'> }) =>
      addMyListItem(vars.listId, vars.item),
    { onSuccess: invalidate },
  );
  const removeItem = useMutation(
    (vars: { listId: number; shortId: string }) =>
      removeMyListItem(vars.listId, vars.shortId),
    { onSuccess: invalidate },
  );
  const create = useMutation(
    (vars: { name: string; emoji: string; color: string }) =>
      createMyList(vars),
    { onSuccess: invalidate },
  );
  const update = useMutation(
    (vars: {
      id: number;
      patch: { name?: string; emoji?: string; color?: string };
    }) => updateMyList(vars.id, vars.patch),
    { onSuccess: invalidate },
  );
  const remove = useMutation((id: number) => deleteMyList(id), {
    onSuccess: invalidate,
  });

  return { addItem, removeItem, create, update, remove };
};

const isInAnyListFn = (lists: UserList[] | null) => (shortId: string) =>
  (lists ?? []).some((list) =>
    list.items.some((item) => item.shortId === shortId),
  );

const listsContainingFn = (lists: UserList[] | null) => (shortId: string) =>
  (lists ?? []).filter((list) =>
    list.items.some((item) => item.shortId === shortId),
  );

export const MyListsProvider: React.FC = ({ children }) => {
  const { loggedIn } = useOsmAuthContext();
  const { lists, isFetching } = useListsQuery(loggedIn);
  const m = useListsMutations();

  const [lastUsedListId, setLastUsedListId] = usePersistedState<number | null>(
    'myLists.lastUsed',
    null,
  );
  const [visibleListIds, setVisibleListIds] = usePersistedState<number[]>(
    'myLists.visible',
    [],
  );

  const toggleListVisibility = useCallback(
    (id: number) => {
      setVisibleListIds((current) =>
        current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id],
      );
    },
    [setVisibleListIds],
  );

  const value = useMemo<MyListsContextType>(
    () => ({
      lists,
      isLoading: isFetching,
      isInAnyList: isInAnyListFn(lists),
      listsContaining: listsContainingFn(lists),
      addToList: async (listId, item) => {
        await m.addItem.mutateAsync({ listId, item });
        setLastUsedListId(listId);
      },
      removeFromList: async (listId, shortId) => {
        await m.removeItem.mutateAsync({ listId, shortId });
      },
      createList: async (name, emoji, color) => {
        const finalColor =
          color ?? pickNextListColor((lists ?? []).map((l) => l.color));
        const { id } = await m.create.mutateAsync({
          name,
          emoji,
          color: finalColor,
        });
        setLastUsedListId(id);
        setVisibleListIds((current) =>
          current.includes(id) ? current : [...current, id],
        );
        return id;
      },
      updateList: async (id, patch) => {
        await m.update.mutateAsync({ id, patch });
      },
      deleteList: async (id) => {
        await m.remove.mutateAsync(id);
        if (lastUsedListId === id) setLastUsedListId(null);
        setVisibleListIds((current) => current.filter((x) => x !== id));
      },
      lastUsedListId,
      setLastUsedListId,
      visibleListIds,
      setVisibleListIds,
      toggleListVisibility,
    }),
    [
      lists,
      isFetching,
      m,
      lastUsedListId,
      setLastUsedListId,
      visibleListIds,
      setVisibleListIds,
      toggleListVisibility,
    ],
  );

  return (
    <MyListsContext.Provider value={value}>{children}</MyListsContext.Provider>
  );
};

export const useMyListsContext = () => {
  const ctx = useContext(MyListsContext);
  if (!ctx) {
    throw new Error('useMyListsContext must be used within a MyListsProvider');
  }
  return ctx;
};
