import styled from '@emotion/styled';
import React, { useEffect, useState } from 'react';
import { toInsertIndexAfterRemove } from '../FeaturePanel/Climbing/utils/array';

export const HighlightedDropzoneVertical = styled.div`
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: 3px;
  margin-left: -1.5px;
  border-radius: 3px;
  background: ${({ theme }) => theme.palette.primary.main};
  pointer-events: none;
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: 50%;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: ${({ theme }) => theme.palette.primary.main};
    transform: translateX(-50%);
  }
`;

export const HighlightedDropzoneHorizontal = styled.div`
  position: absolute;
  left: 8px;
  right: 8px;
  height: 3px;
  margin-top: -1.5px;
  border-radius: 3px;
  background: ${({ theme }) => theme.palette.primary.main};
  pointer-events: none;
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    left: -3px;
    top: 50%;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: ${({ theme }) => theme.palette.primary.main};
    transform: translateY(-50%);
  }
`;

const ItemContainer = styled.div`
  position: relative;
`;

type Item<T> = {
  id: number;
  content: T;
};

type UseDragItemsProps<T> = {
  initialItems: T[];
  moveItems: (oldIndex: number, newIndex: number) => void;
  direction?: 'horizontal' | 'vertical';
};

const getDragOverInsertIndex = (
  direction: 'horizontal' | 'vertical',
  index: number,
  itemsLength: number,
  targetRect: DOMRect,
  clientY: number,
) => {
  if (direction === 'horizontal') {
    const offsetY = clientY - targetRect.top;
    const midY = targetRect.height / 2;
    if (offsetY < midY) return index;
    if (index === itemsLength - 1) return itemsLength;
    return index + 1;
  }
  const offsetY = clientY - targetRect.top;
  if (offsetY < targetRect.width / 2) return index;
  if (index === itemsLength - 1 && offsetY > targetRect.width / 2) {
    return itemsLength;
  }
  return index;
};

const DragDropIndicator = ({
  direction,
  isActive,
  isDragging,
  isDropAllowed,
}: {
  direction: 'horizontal' | 'vertical';
  isActive: boolean;
  isDragging: boolean;
  isDropAllowed: boolean;
}) => {
  if (!isDragging || !isDropAllowed || !isActive) return null;
  if (direction === 'horizontal') return <HighlightedDropzoneHorizontal />;
  return <HighlightedDropzoneVertical />;
};

const reorderItemsAfterDrop = <T,>(
  items: Item<T>[],
  draggedItem: Item<T>,
  draggedOverIndex: number,
): { newItems: Item<T>[]; oldIndex: number; newIndex: number } => {
  const newItems = [...items];
  const oldIndex = items.findIndex((item) => item.id === draggedItem.id);
  newItems.splice(oldIndex, 1);

  const insertAt = toInsertIndexAfterRemove(oldIndex, draggedOverIndex);
  newItems.splice(insertAt, 0, draggedItem);
  return { newItems, oldIndex, newIndex: insertAt };
};

// TODO refactor this - extract member functions
// eslint-disable-next-line max-lines-per-function
export const useDragItems = <T,>({
  initialItems,
  moveItems,
  direction = 'horizontal',
}: UseDragItemsProps<T>) => {
  const [items, setItems] = useState<Item<T>[]>([]);
  const [draggedItem, setDraggedItem] = useState<Item<T> | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const next = (initialItems ?? []).map((item, index) => ({
      id: index,
      content: item,
    }));
    setItems((prev) =>
      prev.length === next.length &&
      prev.every((item, index) => item.content === next[index].content)
        ? prev
        : next,
    );
  }, [initialItems]);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    dragged: Item<T>,
  ) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify(dragged));
    setDraggedItem(dragged);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault();
    let newIndex: number | null = index;

    if (draggedItem) {
      const target = e.target as HTMLDivElement;
      const rawInsertIndex = getDragOverInsertIndex(
        direction,
        index,
        items.length,
        target.getBoundingClientRect(),
        e.clientY,
      );

      const oldIndex = items.findIndex((item) => item.id === draggedItem.id);
      const insertAt = toInsertIndexAfterRemove(oldIndex, rawInsertIndex);
      if (insertAt === oldIndex) {
        newIndex = null;
      } else {
        newIndex = rawInsertIndex;
      }
    }

    if (newIndex !== draggedOverIndex) {
      setDraggedOverIndex(newIndex);
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (draggedOverIndex !== null && draggedItem) {
      const { newItems, oldIndex, newIndex } = reorderItemsAfterDrop(
        items,
        draggedItem,
        draggedOverIndex,
      );
      setItems(newItems);
      moveItems(oldIndex, newIndex);
    }
    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  const isDragging = draggedItem !== null;
  const draggedIndex = isDragging
    ? items.findIndex((item) => item.id === draggedItem.id)
    : null;

  const HighlightedDropzone = ({
    index,
    activeAt,
  }: {
    index: number;
    activeAt?: number;
  }) => {
    const rawInsertIndex = activeAt ?? index;
    const isDropAllowed =
      draggedIndex !== null &&
      toInsertIndexAfterRemove(draggedIndex, rawInsertIndex) !== draggedIndex;
    return (
      <DragDropIndicator
        direction={direction}
        isActive={draggedOverIndex === rawInsertIndex}
        isDragging={isDragging}
        isDropAllowed={isDropAllowed}
      />
    );
  };

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    HighlightedDropzone,
    ItemContainer,
    setDraggedItem,
    setDraggedOverIndex,
    draggedItem,
    draggedOverIndex,
  };
};
