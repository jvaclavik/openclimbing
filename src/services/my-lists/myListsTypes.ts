import { LonLat } from '../types';

export type UserListItem = {
  shortId: string;
  label: string;
  poiType: string;
  center: LonLat;
  addedAt: string;
};

export type UserList = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
  sortOrder: number;
  items: UserListItem[];
};
