import React, { useState, useCallback, MouseEvent, useRef, useEffect } from 'react';
import { Note } from '../types';
import { useBoardStore } from '../store';
import { ReactionPicker } from './ReactionPicker';

interface StickyNoteProps {
  note: Note;
}

// Generate a simple user ID based on browser session
const getUserId = () => {
  let userId = localStorage.getItem('collab-board-user-id');
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('collab-board-user-id', userId);
  }
  return userId;
};

const NOTE_COLORS = {
  yellow: '#FFF9C4',
  pink: '#F8BBD0',
  blue: '#BBDEFB',
  green: '#C8E6C9',
  orange: '#FFE0B2',
  purple: '#E1BEE7',
};

export const StickyNote: React.FC<StickyNoteProps> = ({ note }) => {
  const { updateNote, deleteNote, moveNote, viewPort, addReaction, removeReaction } = useBoardStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [content, setContent] = useState(note.content);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userId = getUserId();

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!isEditing && !showReactionPicker) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({
        x: e.clientX / viewPort.zoom - note.position.x,
        y: e.clientY / viewPort.zoom - note.position.y,
      });
    }
  }, [note.position, isEditing, viewPort.zoom, showReactionPicker]);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const newX = e.clientX / viewPort.zoom - dragStart.x;
      const newY = e.clientY / viewPort.zoom - dragStart.y;
      moveNote(note.id, { x: newX, y: newY });
    }
  }, [isDragging, dragStart, note.id, moveNote, viewPort.zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (content.trim() !== note.content) {
      updateNote(note.id, { content: content.trim() });
    }
  }, [content, note.content, note.id, updateNote]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setContent(note.content);
      setIsEditing(false);
    }
  }, [note.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleAddReaction = useCallback((emoji: string) => {
    addReaction(note.id, emoji, userId);
  }, [note.id, userId, addReaction]);

  const handleRemoveReaction = useCallback((emoji: string) => {
    removeReaction(note.id, emoji, userId);
  }, [note.id, userId, removeReaction]);

  const handleReactionClick = useCallback((emoji: string) => {
    const reaction = note.reactions?.find((r) => r.emoji === emoji);
    if (reaction?.users.includes(userId)) {
      handleRemoveReaction(emoji);
    } else {
      handleAddReaction(emoji);
    }
  }, [note.reactions, userId, handleAddReaction, handleRemoveReaction]);

  const backgroundColor = NOTE_COLORS[note.color as keyof typeof NOTE_COLORS] || NOTE_COLORS.yellow;

  return (
    <div
      style={{
        position: 'absolute',
        left: note.position.x,
        top: note.position.y,
        width: '200px',
        minHeight: '200px',
        backgroundColor,
        borderRadius: '4px',
        padding: '16px',
        boxShadow: isDragging
          ? '0 8px 16px rgba(0,0,0,0.3)'
          : '0 4px 8px rgba(0,0,0,0.1)',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
        zIndex: isDragging ? 1000 : 10,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
        setIsHovering(false);
      }}
      onMouseEnter={() => setIsHovering(true)}
      onDoubleClick={handleDoubleClick}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '11px',
          color: '#666',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 'bold' }}>
            {note.author === 'ai' ? '🤖' : '👤'} {note.authorName || note.author}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNote(note.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: '#666',
            padding: '0',
            lineHeight: '1',
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          fontSize: '10px',
          color: '#888',
          marginBottom: '8px',
          padding: '2px 6px',
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: '3px',
          display: 'inline-block',
          alignSelf: 'flex-start',
        }}
      >
        {note.theme}
      </div>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: '14px',
            lineHeight: '1.5',
            minHeight: '120px',
          }}
        />
      ) : (
        <div
          style={{
            flex: 1,
            fontSize: '14px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {note.content}
        </div>
      )}

      <div
        style={{
          marginTop: '8px',
          fontSize: '9px',
          color: '#999',
          textAlign: 'right',
        }}
      >
        {new Date(note.createdAt).toLocaleString()}
      </div>

      {/* Reactions Display */}
      {note.reactions && note.reactions.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(0,0,0,0.1)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {note.reactions.map((reaction) => {
            const hasReacted = reaction.users.includes(userId);
            return (
              <button
                key={reaction.emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleReactionClick(reaction.emoji);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  border: hasReacted ? '2px solid #2196F3' : '1px solid rgba(0,0,0,0.2)',
                  borderRadius: '12px',
                  backgroundColor: hasReacted ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.15s',
                  fontWeight: hasReacted ? 'bold' : 'normal',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title={`${reaction.count} reaction${reaction.count > 1 ? 's' : ''}`}
              >
                <span>{reaction.emoji}</span>
                <span style={{ fontSize: '11px', color: '#666' }}>{reaction.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Reaction Button - Visible when not dragging or editing */}
      {!isDragging && !isEditing && (
        <div
          style={{
            position: 'relative',
            marginTop: '8px',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowReactionPicker(!showReactionPicker);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            style={{
              width: '100%',
              padding: '6px',
              border: '1px dashed rgba(0,0,0,0.3)',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#666',
              transition: 'all 0.15s',
              fontWeight: '500',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,1)';
              e.currentTarget.style.borderStyle = 'solid';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)';
              e.currentTarget.style.borderStyle = 'dashed';
            }}
          >
            {showReactionPicker ? '✕ Close' : '😊 Add Reaction'}
          </button>

          {showReactionPicker && (
            <ReactionPicker
              onSelectEmoji={handleAddReaction}
              onClose={() => setShowReactionPicker(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};
