import React from 'react';

interface ReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const QUICK_REACTIONS = [
  '👍', // Thumbs up
  '❤️', // Love
  '🎉', // Celebrate
  '💡', // Idea
  '✅', // Done/Approved
  '🤔', // Thinking
  '👀', // Looking/Interested
  '🔥', // Hot/Fire
  '⭐', // Star
  '😄', // Happy
  '👏', // Applause
  '🚀', // Rocket/Progress
];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelectEmoji, onClose }) => {
  return (
    <>
      {/* Backdrop to close picker */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* Picker popup */}
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '4px',
          zIndex: 1000,
          minWidth: '240px',
          animation: 'slideUp 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
            style={{
              fontSize: '24px',
              padding: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};
