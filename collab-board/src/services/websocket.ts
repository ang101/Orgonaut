import { CursorPosition } from '../types';

type MessageType = 'cursor_move' | 'cursor_leave';

interface WebSocketMessage {
  type: MessageType;
  data: CursorPosition | { userId: string };
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private onCursorUpdate?: (cursor: CursorPosition) => void;
  private onCursorLeave?: (userId: string) => void;

  connect(url: string) {
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectDelay = 1000; // Reset reconnect delay on successful connection
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.scheduleReconnect(url);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect(url);
    }
  }

  private scheduleReconnect(url: string) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect(url);
      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'cursor_move':
        if (this.onCursorUpdate) {
          this.onCursorUpdate(message.data as CursorPosition);
        }
        break;
      case 'cursor_leave':
        if (this.onCursorLeave) {
          const data = message.data as { userId: string };
          this.onCursorLeave(data.userId);
        }
        break;
    }
  }

  sendCursorPosition(cursor: CursorPosition) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'cursor_move',
        data: cursor,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  sendCursorLeave(userId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'cursor_leave',
        data: { userId },
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  onMessage(
    onCursorUpdate: (cursor: CursorPosition) => void,
    onCursorLeave: (userId: string) => void
  ) {
    this.onCursorUpdate = onCursorUpdate;
    this.onCursorLeave = onCursorLeave;
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// Configuration
export const WEBSOCKET_CONFIG = {
  // Replace with your WebSocket server URL
  // For local development, you might use: 'ws://localhost:8080'
  // For production, use: 'wss://your-domain.com/ws'
  url: '', // Empty by default - set this when you have a WebSocket server
  enabled: false, // Set to true when WebSocket server is available
};
