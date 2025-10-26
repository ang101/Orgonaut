import React, { useState } from 'react';
import { useBoardStore } from '../store';
import { claudeService } from '../services/claude';
import { ExportService } from '../services/export';

const NOTE_COLORS = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'];

export const Toolbar: React.FC = () => {
  const { addNote, themes, addTheme, updateViewPort, notes, addGroup, groups } = useBoardStore();

  const [selectedColor, setSelectedColor] = useState('yellow');
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [customTheme, setCustomTheme] = useState('');
  const [showThemeInput, setShowThemeInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!claudeService.isConfigured());
  const [aiNoteCount, setAiNoteCount] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleAddNote = () => {
    addNote({
      content: 'Double click to edit',
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 500 + 100,
      },
      color: selectedColor,
      theme: selectedTheme,
      author: 'human',
      authorName: 'You',
    });
  };

  const handleAddCustomTheme = () => {
    if (customTheme.trim()) {
      addTheme(customTheme.trim());
      setSelectedTheme(customTheme.trim());
      setCustomTheme('');
      setShowThemeInput(false);
    }
  };

  const handleAskClaude = async () => {
    if (!aiPrompt.trim()) return;

    if (!claudeService.isConfigured()) {
      alert('Please configure your Claude API key first');
      setShowApiKeyInput(true);
      return;
    }

    setIsAiLoading(true);
    try {
      if (aiNoteCount === 1) {
        const content = await claudeService.generateNote(
          aiPrompt,
          `Existing notes on board: ${notes.map((n) => n.content).join(', ')}`
        );

        addNote({
          content,
          position: {
            x: Math.random() * 500 + 100,
            y: Math.random() * 500 + 100,
          },
          color: selectedColor,
          theme: selectedTheme,
          author: 'ai',
          authorName: 'Claude',
        });
      } else {
        const contents = await claudeService.generateMultipleNotes(
          aiPrompt,
          aiNoteCount,
          selectedTheme
        );

        contents.forEach((content, index) => {
          addNote({
            content,
            position: {
              x: 100 + (index % 3) * 250,
              y: 100 + Math.floor(index / 3) * 250,
            },
            color: selectedColor,
            theme: selectedTheme,
            author: 'ai',
            authorName: 'Claude',
          });
        });
      }

      setAiPrompt('');
    } catch (error) {
      console.error('Claude API error:', error);
      alert(`Failed to generate note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      claudeService.setApiKey(apiKey.trim());
      setShowApiKeyInput(false);
      alert('API key saved! You can now use Claude AI features.');
    }
  };

  const handleAutoOrganize = async () => {
    if (!claudeService.isConfigured()) {
      alert('Please configure your Claude API key first');
      setShowApiKeyInput(true);
      return;
    }

    setIsAiLoading(true);
    try {
      const noteContents = notes.map((n) => n.content);
      const organization = await claudeService.organizeBoardByThemes(noteContents);

      // Create groups for each theme
      Object.entries(organization).forEach(([themeName, noteIndices]) => {
        if (noteIndices.length > 0) {
          const groupNotes = noteIndices.map((i) => notes[i]).filter(Boolean);

          // Calculate bounding box for group
          const minX = Math.min(...groupNotes.map((n) => n.position.x)) - 20;
          const minY = Math.min(...groupNotes.map((n) => n.position.y)) - 40;
          const maxX = Math.max(...groupNotes.map((n) => n.position.x + 200)) + 20;
          const maxY = Math.max(...groupNotes.map((n) => n.position.y + 200)) + 20;

          addGroup({
            name: themeName,
            notes: groupNotes.map((n) => n.id),
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
            position: { x: minX, y: minY },
            size: { width: maxX - minX, height: maxY - minY },
          });
        }
      });

      alert('Board organized by themes!');
    } catch (error) {
      console.error('Auto-organize error:', error);
      alert('Failed to organize board');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleResetView = () => {
    updateViewPort({ x: 0, y: 0, zoom: 1 });
  };

  const handleExport = async (format: 'pdf' | 'json' | 'csv' | 'markdown') => {
    if (notes.length === 0) {
      alert('No notes to export!');
      return;
    }

    setIsExporting(true);
    try {
      switch (format) {
        case 'pdf':
          ExportService.exportAsPDF(notes, groups, themes);
          break;
        case 'json':
          ExportService.exportAsJSON(notes, groups, themes);
          break;
        case 'csv':
          ExportService.exportAsCSV(notes);
          break;
        case 'markdown':
          ExportService.exportAsMarkdown(notes, groups, themes);
          break;
      }
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderBottom: '2px solid #ddd',
        padding: '12px 16px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
      }}
    >
      <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
        🎨 Collaborative Board
      </h1>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ fontSize: '14px', fontWeight: '500' }}>Color:</label>
        {NOTE_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: selectedColor === color ? '3px solid #333' : '2px solid #ccc',
              backgroundColor:
                color === 'yellow'
                  ? '#FFF9C4'
                  : color === 'pink'
                  ? '#F8BBD0'
                  : color === 'blue'
                  ? '#BBDEFB'
                  : color === 'green'
                  ? '#C8E6C9'
                  : color === 'orange'
                  ? '#FFE0B2'
                  : '#E1BEE7',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ fontSize: '14px', fontWeight: '500' }}>Theme:</label>
        <select
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px',
          }}
        >
          {themes.map((theme) => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowThemeInput(!showThemeInput)}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          +
        </button>
      </div>

      {showThemeInput && (
        <div style={{ display: 'flex', gap: '4px' }}>
          <input
            type="text"
            value={customTheme}
            onChange={(e) => setCustomTheme(e.target.value)}
            placeholder="New theme name"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTheme()}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
            }}
          />
          <button
            onClick={handleAddCustomTheme}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Add
          </button>
        </div>
      )}

      <button
        onClick={handleAddNote}
        style={{
          padding: '8px 16px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: '#2196F3',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
      >
        + New Note
      </button>

      <div
        style={{
          borderLeft: '2px solid #ddd',
          height: '40px',
          marginLeft: '8px',
        }}
      />

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>🤖 AI:</span>
        <input
          type="number"
          min="1"
          max="10"
          value={aiNoteCount}
          onChange={(e) => setAiNoteCount(parseInt(e.target.value) || 1)}
          style={{
            width: '50px',
            padding: '6px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px',
          }}
          title="Number of notes to generate"
        />
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Ask Claude to create notes..."
          onKeyPress={(e) => e.key === 'Enter' && handleAskClaude()}
          disabled={isAiLoading}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px',
          }}
        />
        <button
          onClick={handleAskClaude}
          disabled={isAiLoading}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: isAiLoading ? '#ccc' : '#9C27B0',
            color: 'white',
            cursor: isAiLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          {isAiLoading ? 'Thinking...' : 'Ask Claude'}
        </button>
        <button
          onClick={handleAutoOrganize}
          disabled={isAiLoading || notes.length === 0}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: isAiLoading || notes.length === 0 ? '#ccc' : '#FF9800',
            color: 'white',
            cursor: isAiLoading || notes.length === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          Auto-Organize
        </button>
      </div>

      <button
        onClick={handleResetView}
        style={{
          padding: '8px 16px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          backgroundColor: 'white',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Reset View
      </button>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={notes.length === 0}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: notes.length === 0 ? '#f0f0f0' : '#4CAF50',
            color: notes.length === 0 ? '#999' : 'white',
            cursor: notes.length === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          {isExporting ? '⏳ Exporting...' : '📥 Export'}
        </button>

        {showExportMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              padding: '8px',
              minWidth: '180px',
              zIndex: 1001,
            }}
          >
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              style={{
                width: '100%',
                padding: '10px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              📄 Export as PDF
            </button>
            <button
              onClick={() => handleExport('markdown')}
              disabled={isExporting}
              style={{
                width: '100%',
                padding: '10px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              📝 Export as Markdown
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              style={{
                width: '100%',
                padding: '10px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              📊 Export as CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              style={{
                width: '100%',
                padding: '10px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              💾 Export as JSON
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowApiKeyInput(!showApiKeyInput)}
        style={{
          padding: '8px 16px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          backgroundColor: claudeService.isConfigured() ? '#4CAF50' : 'white',
          color: claudeService.isConfigured() ? 'white' : 'black',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        {claudeService.isConfigured() ? '✓ API Key' : 'Set API Key'}
      </button>

      {showApiKeyInput && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            right: '16px',
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            zIndex: 1001,
          }}
        >
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter Claude API key"
            onKeyPress={(e) => e.key === 'Enter' && handleSaveApiKey()}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              width: '300px',
            }}
          />
          <button
            onClick={handleSaveApiKey}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            Save
          </button>
          <button
            onClick={() => setShowApiKeyInput(false)}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
