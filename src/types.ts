export interface Position {
  x: number;
  y: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // User identifiers who reacted
}

export interface Note {
  id: string;
  content: string;
  position: Position;
  color: string;
  theme: string;
  author: 'human' | 'ai';
  authorName?: string;
  groupId?: string;
  createdAt: number;
  reactions?: Reaction[];
}

export interface Group {
  id: string;
  name: string;
  notes: string[]; // Note IDs
  color: string;
  position: Position;
  size: { width: number; height: number };
}

export interface CursorPosition {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

export interface UserPresence {
  userId: string;
  userName: string;
  color: string;
  lastActive: number;
}

export interface BoardState {
  notes: Note[];
  groups: Group[];
  selectedNoteIds: string[];
  selectedGroupIds: string[];
  viewPort: {
    x: number;
    y: number;
    zoom: number;
  };
  themes: string[];
  // Cursor tracking for collaboration
  localUserId: string;
  localUserName: string;
  localUserColor: string;
  remoteCursors: Record<string, CursorPosition>;
}
