import { UserList, UserListItem } from './myListsTypes';

export const FAVORITES_ID = -1;
export const VISITED_ID = -2;

const visited: Array<[string, string, UserListItem['center']]> = [
  ['w42213444', 'Lenzsteig', [9.7612947, 49.9913425]],
  ['w84013032', 'Tegelbergsteig', [10.7747456, 47.5626131]],
  ['w219231582', 'Ferrata Burrone Giovannelli', [11.0987999, 46.2304381]],
  ['w1156787758', 'Norissteig', [11.5306697, 49.5441152]],
  ['w37293628', 'Stopselzieher', [10.9729653, 47.4225221]],
];

export const INITIAL_LOCAL_LISTS: UserList[] = [
  {
    id: FAVORITES_ID,
    name: 'Favoriten',
    emoji: '⭐',
    color: '#ffe08a',
    items: [],
    sortOrder: 0,
    createdAt: new Date(0).toISOString(),
  },
  {
    id: VISITED_ID,
    name: 'Schon da gewesen',
    emoji: '✓',
    color: '#a9e7c6',
    items: visited.map(([shortId, label, center]) => ({
      shortId,
      label,
      center,
      poiType: 'Klettersteig',
      addedAt: new Date(0).toISOString(),
    })),
    sortOrder: 1,
    createdAt: new Date(0).toISOString(),
  },
];
