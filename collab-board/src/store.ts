import { create } from 'zustand';
import { BoardState, Note, Group, Position, CursorPosition } from './types';

interface BoardStore extends BoardState {
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  moveNote: (id: string, position: Position) => void;

  addGroup: (group: Omit<Group, 'id'>) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  addNoteToGroup: (noteId: string, groupId: string) => void;
  removeNoteFromGroup: (noteId: string) => void;

  setSelectedNotes: (ids: string[]) => void;
  setSelectedGroups: (ids: string[]) => void;

  updateViewPort: (updates: Partial<BoardState['viewPort']>) => void;

  addTheme: (theme: string) => void;

  addReaction: (noteId: string, emoji: string, userId: string) => void;
  removeReaction: (noteId: string, emoji: string, userId: string) => void;

  // Cursor tracking methods
  updateRemoteCursor: (cursor: CursorPosition) => void;
  removeRemoteCursor: (userId: string) => void;
  initializeUser: (userName?: string) => void;

  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'collab-board-state';
const USER_ID_KEY = 'collab-board-user-id';
const USER_NAME_KEY = 'collab-board-user-name';

// Generate random user color from a pleasant palette
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E',
];

const getRandomColor = () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

const initializeUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

const initializeUserName = (): string => {
  let userName = localStorage.getItem(USER_NAME_KEY);
  if (!userName) {
    userName = `User ${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem(USER_NAME_KEY, userName);
  }
  return userName;
};

export const useBoardStore = create<BoardStore>((set, get) => ({
  notes: [],
  groups: [],
  selectedNoteIds: [],
  selectedGroupIds: [],
  viewPort: { x: 0, y: 0, zoom: 1 },
  themes: ['General', 'Ideas', 'Todo', 'Important', 'Questions'],
  localUserId: initializeUserId(),
  localUserName: initializeUserName(),
  localUserColor: getRandomColor(),
  remoteCursors: {},

  addNote: (note) => {
    const newNote: Note = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    set((state) => ({ notes: [...state.notes, newNote] }));
    get().saveToStorage();
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates } : note
      ),
    }));
    get().saveToStorage();
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      groups: state.groups.map((group) => ({
        ...group,
        notes: group.notes.filter((noteId) => noteId !== id),
      })),
    }));
    get().saveToStorage();
  },

  moveNote: (id, position) => {
    get().updateNote(id, { position });
  },

  addGroup: (group) => {
    const newGroup: Group = {
      ...group,
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    set((state) => ({ groups: [...state.groups, newGroup] }));
    get().saveToStorage();
  },

  updateGroup: (id, updates) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === id ? { ...group, ...updates } : group
      ),
    }));
    get().saveToStorage();
  },

  deleteGroup: (id) => {
    const group = get().groups.find((g) => g.id === id);
    if (group) {
      group.notes.forEach((noteId) => {
        get().updateNote(noteId, { groupId: undefined });
      });
    }
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== id),
    }));
    get().saveToStorage();
  },

  addNoteToGroup: (noteId, groupId) => {
    get().updateNote(noteId, { groupId });
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId && !group.notes.includes(noteId)
          ? { ...group, notes: [...group.notes, noteId] }
          : group
      ),
    }));
    get().saveToStorage();
  },

  removeNoteFromGroup: (noteId) => {
    const note = get().notes.find((n) => n.id === noteId);
    if (note?.groupId) {
      get().updateNote(noteId, { groupId: undefined });
      set((state) => ({
        groups: state.groups.map((group) =>
          group.id === note.groupId
            ? { ...group, notes: group.notes.filter((id) => id !== noteId) }
            : group
        ),
      }));
      get().saveToStorage();
    }
  },

  setSelectedNotes: (ids) => set({ selectedNoteIds: ids }),
  setSelectedGroups: (ids) => set({ selectedGroupIds: ids }),

  updateViewPort: (updates) =>
    set((state) => ({
      viewPort: { ...state.viewPort, ...updates },
    })),

  addTheme: (theme) => {
    set((state) => ({
      themes: state.themes.includes(theme) ? state.themes : [...state.themes, theme],
    }));
    get().saveToStorage();
  },

  addReaction: (noteId, emoji, userId) => {
    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id !== noteId) return note;

        const reactions = note.reactions || [];
        const existingReaction = reactions.find((r) => r.emoji === emoji);

        if (existingReaction) {
          // User already reacted with this emoji, don't add again
          if (existingReaction.users.includes(userId)) {
            return note;
          }
          // Add user to existing reaction
          return {
            ...note,
            reactions: reactions.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, users: [...r.users, userId] }
                : r
            ),
          };
        }

        // Add new reaction
        return {
          ...note,
          reactions: [...reactions, { emoji, count: 1, users: [userId] }],
        };
      }),
    }));
    get().saveToStorage();
  },

  removeReaction: (noteId, emoji, userId) => {
    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id !== noteId || !note.reactions) return note;

        const reactions = note.reactions
          .map((r) => {
            if (r.emoji !== emoji) return r;
            // Remove user from reaction
            const newUsers = r.users.filter((u) => u !== userId);
            return { ...r, count: newUsers.length, users: newUsers };
          })
          .filter((r) => r.count > 0); // Remove reactions with 0 count

        return { ...note, reactions };
      }),
    }));
    get().saveToStorage();
  },

  updateRemoteCursor: (cursor) => {
    set((state) => ({
      remoteCursors: {
        ...state.remoteCursors,
        [cursor.userId]: cursor,
      },
    }));
  },

  removeRemoteCursor: (userId) => {
    set((state) => {
      const { [userId]: _, ...rest } = state.remoteCursors;
      return { remoteCursors: rest };
    });
  },

  initializeUser: (userName) => {
    if (userName) {
      localStorage.setItem(USER_NAME_KEY, userName);
      set({ localUserName: userName });
    }
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          notes: data.notes || [],
          groups: data.groups || [],
          themes: data.themes || ['General', 'Ideas', 'Todo', 'Important', 'Questions'],
        });
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },

  saveToStorage: () => {
    try {
      const { notes, groups, themes } = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ notes, groups, themes })
      );
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },
}));
