# Real-Time Cursor Tracking Feature

This document describes the real-time cursor tracking feature that shows where other users are working on the board with name labels to improve collaboration awareness.

## Overview

The cursor tracking system allows multiple users to see each other's cursors in real-time, with smooth animations and personalized name labels. Each user is assigned a unique color for easy identification.

## Features

- **Real-time cursor positions**: See where other users' cursors are on the board
- **Smooth animations**: Cursors animate smoothly with CSS transitions
- **Name labels**: Each cursor displays the user's name
- **Unique colors**: Each user gets a distinct color from a pleasant palette
- **Automatic cleanup**: Stale cursors (inactive for 10+ seconds) are automatically removed
- **Persistent user identity**: User ID and name are stored in localStorage

## Architecture

### Components

1. **RemoteCursor** ([src/components/RemoteCursor.tsx](src/components/RemoteCursor.tsx))
   - Renders a single remote cursor with an SVG cursor icon and name label
   - Positioned absolutely with smooth transitions
   - Non-interactive (pointer-events: none)

2. **CursorLayer** ([src/components/CursorLayer.tsx](src/components/CursorLayer.tsx))
   - Container component that renders all remote cursors
   - Handles automatic cleanup of stale cursors
   - Fixed positioned overlay on top of the canvas

3. **Canvas** ([src/components/Canvas.tsx](src/components/Canvas.tsx))
   - Integrates cursor tracking with mouse movement
   - Broadcasts cursor position changes
   - Connects to WebSocket service when available

### State Management

The cursor tracking state is managed in the Zustand store ([src/store.ts](src/store.ts)):

```typescript
interface BoardState {
  // ... existing state
  localUserId: string;
  localUserName: string;
  localUserColor: string;
  remoteCursors: Record<string, CursorPosition>;
}
```

**Store Methods:**
- `updateRemoteCursor(cursor)` - Add or update a remote cursor
- `removeRemoteCursor(userId)` - Remove a specific user's cursor
- `initializeUser(userName)` - Set custom user name

### WebSocket Service

The WebSocket service ([src/services/websocket.ts](src/services/websocket.ts)) handles real-time communication:

**Features:**
- Automatic reconnection with exponential backoff
- Message type system for cursor events
- Singleton pattern for global access
- Connection status monitoring

**Message Types:**
- `cursor_move` - Cursor position update
- `cursor_leave` - User disconnected

## Usage

### Demo Mode (Current State)

The feature currently runs in **demo mode** without requiring a WebSocket server. It simulates a remote cursor offset from your cursor position to demonstrate the feature.

To test:
1. Start the development server: `npm run dev`
2. Move your cursor around the canvas
3. You'll see a "Demo User" cursor following yours with an offset

### Production Mode (WebSocket Required)

To enable real WebSocket communication:

1. **Set up a WebSocket server** that handles these message types:
   ```typescript
   {
     type: 'cursor_move',
     data: {
       userId: string,
       userName: string,
       x: number,
       y: number,
       color: string,
       timestamp: number
     }
   }
   ```

2. **Configure the WebSocket URL** in [src/services/websocket.ts](src/services/websocket.ts):
   ```typescript
   export const WEBSOCKET_CONFIG = {
     url: 'ws://localhost:8080', // or wss://your-domain.com/ws
     enabled: true,
   };
   ```

3. **Server Requirements:**
   - Broadcast incoming cursor positions to all other connected clients
   - Handle disconnections and notify clients when users leave
   - Optional: Add rooms/channels for different boards

### Customization

**Change User Name:**
```typescript
import { useBoardStore } from './store';

const { initializeUser } = useBoardStore();
initializeUser('John Doe');
```

**Adjust Cursor Colors:**
Edit the `USER_COLORS` array in [src/store.ts](src/store.ts):
```typescript
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', // ... add more colors
];
```

**Configure Cursor Cleanup Interval:**
In [src/components/CursorLayer.tsx](src/components/CursorLayer.tsx), adjust the timeout values:
```typescript
// Remove cursors inactive for 10 seconds
if (now - cursor.timestamp > 10000) {
  removeRemoteCursor(cursor.userId);
}
```

## Implementation Details

### Cursor Broadcasting

Cursor positions are broadcast on every mouse move event:

```typescript
const handleGlobalMouseMove = (e: globalThis.MouseEvent) => {
  broadcastCursor(e.clientX, e.clientY);
};
```

### Throttling (Recommended)

For production, consider throttling cursor updates to reduce network traffic:

```typescript
import { throttle } from 'lodash';

const throttledBroadcast = throttle(broadcastCursor, 50); // 20 updates/second
```

### Performance Considerations

- Cursor rendering uses CSS transforms for optimal performance
- Transitions are hardware-accelerated
- Stale cursor cleanup prevents memory leaks
- Only active cursors are rendered

## WebSocket Server Example

Here's a minimal Node.js WebSocket server example:

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data);

    if (message.type === 'cursor_move') {
      // Broadcast to all other clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  });

  ws.on('close', () => {
    // Notify others about disconnection
  });
});
```

## Future Enhancements

- [ ] Add cursor throttling for better performance
- [ ] Implement cursor prediction/interpolation
- [ ] Add viewport awareness (only show cursors in visible area)
- [ ] Support cursor "click" animations
- [ ] Add user presence list/sidebar
- [ ] Implement cursor following (jump to user's location)
- [ ] Add privacy controls (hide cursor option)
- [ ] Support multiple rooms/boards

## Files Modified/Created

**New Files:**
- `src/components/RemoteCursor.tsx` - Cursor component
- `src/components/CursorLayer.tsx` - Cursor container
- `src/services/websocket.ts` - WebSocket service
- `CURSOR_TRACKING.md` - This documentation

**Modified Files:**
- `src/types.ts` - Added cursor tracking types
- `src/store.ts` - Extended state with cursor tracking
- `src/components/Canvas.tsx` - Integrated cursor broadcasting

## Troubleshooting

**Cursors not appearing:**
- Check that `remoteCursors` in the store is being updated
- Verify cursor timestamp is recent (< 10 seconds)
- Ensure CursorLayer is rendered in the component tree

**WebSocket not connecting:**
- Verify `WEBSOCKET_CONFIG.enabled` is `true`
- Check WebSocket server URL is correct
- Look for connection errors in browser console
- Ensure server is running and accessible

**Performance issues:**
- Add throttling to cursor broadcasts
- Limit the number of visible cursors
- Use React.memo for RemoteCursor component
