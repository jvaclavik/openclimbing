import React from 'react';
import { Box } from '@mui/material';
import { useMultiEdit } from '../../../context/useMultiEdit';
import { EditorHeader } from './EditorHeader';
import { EditorItem } from './EditorItem';

export const MultiValueKeyEditor: React.FC<{
  keys: string[];
  editableValues?: string[];
  label: string;
}> = ({ keys, editableValues = [], label }) => {
  const { tags, mixed } = useMultiEdit();
  const visible = keys.filter(
    (k) =>
      tags[k] !== undefined || Object.prototype.hasOwnProperty.call(mixed, k),
  );
  const inactive = keys.filter((k) => !visible.includes(k));

  return (
    <>
      <EditorHeader label={label} inactive={inactive} />
      {visible.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            mb: 2,
          }}
        >
          {visible.map((k) => (
            <EditorItem
              key={k}
              k={k}
              customValue={editableValues.includes(k)}
            />
          ))}
        </Box>
      )}
    </>
  );
};
