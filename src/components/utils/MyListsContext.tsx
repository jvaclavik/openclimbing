import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
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
import {
  INITIAL_LOCAL_LISTS,
  VISITED_ID,
} from '../../services/my-lists/localFerrataLists';
import { HAS_USER_DB } from '../../services/osm/consts';

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

const AccountMyListsProvider: React.FC = ({ children }) => {
  const { loggedIn } = useOsmAuthContext();
  const { lists, isFetching } = useListsQuery(loggedIn && HAS_USER_DB);
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

const LocalMyListsProvider: React.FC = ({ children }) => {
  const [lists, setLists] = usePersistedState(
    'myLists.local',
    INITIAL_LOCAL_LISTS,
  );
  const [lastUsedListId, setLastUsedListId] = usePersistedState<number | null>(
    'myLists.local.lastUsed',
    null,
  );
  const [visibleListIds, setVisibleListIds] = usePersistedState<number[]>(
    'myLists.local.visible',
    [VISITED_ID],
  );
  const latestId = useRef(0);

  const value: MyListsContextType = {
    lists,
    isLoading: false,
    isInAnyList: isInAnyListFn(lists),
    listsContaining: listsContainingFn(lists),
    addToList: async (id, item) => {
      const entry = { ...item, addedAt: new Date().toISOString() };
      setLists((current) =>
        current.map((list) =>
          list.id !== id ||
          list.items.some(({ shortId }) => shortId === item.shortId)
            ? list
            : { ...list, items: [...list.items, entry] },
        ),
      );
    },
    removeFromList: async (id, shortId) => {
      setLists((current) =>
        current.map((list) =>
          list.id === id
            ? {
                ...list,
                items: list.items.filter((item) => item.shortId !== shortId),
              }
            : list,
        ),
      );
    },
    createList: async (name, emoji, color) => {
      const id = Math.max(
        Date.now(),
        latestId.current + 1,
        ...lists.map((list) => list.id + 1),
      );
      latestId.current = id;
      const createdAt = new Date().toISOString();
      setLists((current) => [
        ...current,
        {
          id,
          name,
          emoji,
          color: color ?? pickNextListColor(current.map((list) => list.color)),
          createdAt,
          sortOrder: current.length,
          items: [],
        },
      ]);
      setVisibleListIds((current) => [...current, id]);
      return id;
    },
    updateList: async (id, patch) => {
      if (id < 0) return;
      setLists((current) =>
        current.map((list) => (list.id === id ? { ...list, ...patch } : list)),
      );
    },
    deleteList: async (id) => {
      if (id < 0) return;
      setLists((current) => current.filter((list) => list.id !== id));
      setVisibleListIds((current) => current.filter((listId) => listId !== id));
    },
    lastUsedListId,
    setLastUsedListId,
    visibleListIds,
    setVisibleListIds,
    toggleListVisibility: (id) => {
      setVisibleListIds((current) =>
        current.includes(id)
          ? current.filter((listId) => listId !== id)
          : [...current, id],
      );
    },
  };
  return (
    <MyListsContext.Provider value={value}>{children}</MyListsContext.Provider>
  );
};

export const MyListsProvider = HAS_USER_DB
  ? AccountMyListsProvider
  : LocalMyListsProvider;

export const useMyListsContext = () => {
  const ctx = useContext(MyListsContext);
  if (!ctx) {
    throw new Error('useMyListsContext must be used within a MyListsProvider');
  }
  return ctx;
};
