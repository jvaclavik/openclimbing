import { UserList } from '../../services/my-lists/myListsTypes';

/** Formats a list as `emoji name` if emoji is set, otherwise just `name`. */
export const formatListLabel = (list: Pick<UserList, 'emoji' | 'name'>) => {
  const emoji = list.emoji?.trim();
  return emoji ? `${emoji} ${list.name}` : list.name;
};
