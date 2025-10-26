import React from 'react';
import { CursorPosition } from '../types';

interface RemoteCursorProps {
  cursor: CursorPosition;
}

export const RemoteCursor: React.FC<RemoteCursorProps> = ({ cursor }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: cursor.x,
        top: cursor.y,
        pointerEvents: 'none',
        zIndex: 10000,
        transition: 'left 0.1s ease-out, top 0.1s ease-out',
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      >
        <path
          d="M5 3L19 12L12 13L9 20L5 3Z"
          fill={cursor.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name label */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '12px',
          backgroundColor: cursor.color,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {cursor.userName}
      </div>
    </div>
  );
};
