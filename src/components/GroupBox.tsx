import React, { useState, useCallback, MouseEvent } from 'react';
import { Group } from '../types';
import { useBoardStore } from '../store';

interface GroupBoxProps {
  group: Group;
}

export const GroupBox: React.FC<GroupBoxProps> = ({ group }) => {
  const { updateGroup, deleteGroup } = useBoardStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - group.position.x,
      y: e.clientY - group.position.y,
    });
  }, [group.position]);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateGroup(group.id, {
        position: {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        },
      });
    }
  }, [isDragging, dragStart, group.id, updateGroup]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        left: group.position.x,
        top: group.position.y,
        width: group.size.width,
        height: group.size.height,
        border: `3px dashed ${group.color}`,
        borderRadius: '8px',
        backgroundColor: `${group.color}10`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{
          position: 'absolute',
          top: -30,
          left: 0,
          padding: '4px 12px',
          backgroundColor: group.color,
          color: 'white',
          borderRadius: '4px 4px 0 0',
          fontWeight: 'bold',
          fontSize: '14px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <span>{group.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteGroup(group.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0 4px',
            fontSize: '16px',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};
