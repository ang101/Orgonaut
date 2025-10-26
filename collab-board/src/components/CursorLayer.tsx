import React, { useEffect } from 'react';
import { useBoardStore } from '../store';
import { RemoteCursor } from './RemoteCursor';

export const CursorLayer: React.FC = () => {
  const remoteCursors = useBoardStore((state) => state.remoteCursors);
  const removeRemoteCursor = useBoardStore((state) => state.removeRemoteCursor);

  // Clean up stale cursors (older than 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      Object.values(remoteCursors).forEach((cursor) => {
        if (now - cursor.timestamp > 10000) {
          removeRemoteCursor(cursor.userId);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [remoteCursors, removeRemoteCursor]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {Object.values(remoteCursors).map((cursor) => (
        <RemoteCursor key={cursor.userId} cursor={cursor} />
      ))}
    </div>
  );
};
