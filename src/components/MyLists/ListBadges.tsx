import React from 'react';
import { Stack, Tooltip } from '@mui/material';
import { UserList } from '../../services/my-lists/myListsTypes';
import { ListAvatar } from './ListAvatar';

type Props = {
  lists: UserList[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
};

export const ListBadges = ({ lists, size = 'xs' }: Props) => {
  if (lists.length === 0) return null;
  return (
    <Stack direction="row" gap={0.5} sx={{ flexShrink: 0 }}>
      {lists.map((list) => (
        <Tooltip key={list.id} title={list.name} arrow>
          <span>
            <ListAvatar emoji={list.emoji} color={list.color} size={size} />
          </span>
        </Tooltip>
      ))}
    </Stack>
  );
};
