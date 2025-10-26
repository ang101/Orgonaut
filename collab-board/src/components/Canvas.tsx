import React, { useRef, useState, useCallback, MouseEvent, WheelEvent, useEffect } from 'react';
import { useBoardStore } from '../store';
import { StickyNote } from './StickyNote';
import { GroupBox } from './GroupBox';
import { CursorLayer } from './CursorLayer';
import { websocketService, WEBSOCKET_CONFIG } from '../services/websocket';

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    viewPort,
    updateViewPort,
    notes,
    groups,
    localUserId,
    localUserName,
    localUserColor,
    updateRemoteCursor,
    removeRemoteCursor,
  } = useBoardStore();

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Initialize WebSocket connection
  useEffect(() => {
    if (WEBSOCKET_CONFIG.enabled && WEBSOCKET_CONFIG.url) {
      websocketService.connect(WEBSOCKET_CONFIG.url);

      websocketService.onMessage(
        (cursor) => {
          // Don't show our own cursor
          if (cursor.userId !== localUserId) {
            updateRemoteCursor(cursor);
          }
        },
        (userId) => {
          removeRemoteCursor(userId);
        }
      );

      return () => {
        websocketService.sendCursorLeave(localUserId);
        websocketService.disconnect();
      };
    }
  }, [localUserId, updateRemoteCursor, removeRemoteCursor]);

  // Broadcast cursor position
  const broadcastCursor = useCallback((x: number, y: number) => {
    const cursorData = {
      userId: localUserId,
      userName: localUserName,
      x,
      y,
      color: localUserColor,
      timestamp: Date.now(),
    };

    // Send via WebSocket if available
    if (WEBSOCKET_CONFIG.enabled && websocketService.isConnected()) {
      websocketService.sendCursorPosition(cursorData);
    } else {
      // Demo mode: Simulate a remote cursor for local testing
      // Remove this block when WebSocket is fully implemented
      updateRemoteCursor({
        userId: 'demo-user-remote',
        userName: 'Demo User',
        x: x + 50, // Offset slightly to show it's different
        y: y + 50,
        color: '#FF6B6B',
        timestamp: Date.now(),
      });
    }
  }, [localUserId, localUserName, localUserColor, updateRemoteCursor]);

  // Track cursor movement
  useEffect(() => {
    const handleGlobalMouseMove = (e: globalThis.MouseEvent) => {
      // Broadcast cursor position
      broadcastCursor(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [broadcastCursor]);

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewPort.x, y: e.clientY - viewPort.y });
    }
  }, [viewPort]);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      updateViewPort({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart, updateViewPort]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.1, viewPort.zoom + delta), 3);

    // Zoom towards cursor position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomPoint = {
        x: (mouseX - viewPort.x) / viewPort.zoom,
        y: (mouseY - viewPort.y) / viewPort.zoom,
      };

      updateViewPort({
        zoom: newZoom,
        x: mouseX - zoomPoint.x * newZoom,
        y: mouseY - zoomPoint.y * newZoom,
      });
    }
  }, [viewPort, updateViewPort]);

  return (
    <>
      <div
        ref={canvasRef}
        className="canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : 'grab',
          position: 'relative',
          background: 'linear-gradient(90deg, #f0f0f0 1px, transparent 1px), linear-gradient(#f0f0f0 1px, transparent 1px)',
          backgroundSize: `${20 * viewPort.zoom}px ${20 * viewPort.zoom}px`,
          backgroundPosition: `${viewPort.x}px ${viewPort.y}px`,
        }}
      >
        <div
          style={{
            transform: `translate(${viewPort.x}px, ${viewPort.y}px) scale(${viewPort.zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        >
          {groups.map((group) => (
            <GroupBox key={group.id} group={group} />
          ))}

          {notes.map((note) => (
            <StickyNote key={note.id} note={note} />
          ))}
        </div>
      </div>

      {/* Render remote cursors on top of everything */}
      <CursorLayer />
    </>
  );
};
