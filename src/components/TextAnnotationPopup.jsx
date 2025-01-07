import React, { useState } from 'react';
import { FaHighlighter, FaStickyNote, FaClipboard } from 'react-icons/fa';

const HIGHLIGHT_COLORS = [
  { name: 'yellow', value: 'rgba(255, 255, 0, 0.3)' },
  { name: 'green', value: 'rgba(144, 238, 144, 0.3)' },
  { name: 'pink', value: 'rgba(255, 182, 193, 0.3)' },
  { name: 'blue', value: 'rgba(173, 216, 230, 0.3)' },
  { name: 'orange', value: 'rgba(255, 165, 0, 0.3)' }
];

const TextAnnotationPopup = ({ 
  selectedText, 
  position, 
  onHighlight, 
  onStickyNote, 
  onCopyText 
}) => {
  const [showColors, setShowColors] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  const handleHighlight = (color) => {
    onHighlight(selectedText, color);
    setShowColors(false);
  };

  const handleStickyNote = () => {
    onStickyNote(selectedText, noteText);
    setShowNoteInput(false);
    setNoteText('');
  };

  const popupStyle = {
    position: 'fixed',
    top: position.top,
    left: position.left,
    zIndex: 1000
  };

  return (
    <div style={popupStyle}>
      <div className="d-flex align-items-center bg-white rounded p-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
        <button 
          onClick={() => setShowColors(!showColors)} 
          className="btn btn-light btn-sm me-2 p-1"
        >
          <FaHighlighter size={16} />
        </button>
        <button 
          onClick={() => setShowNoteInput(!showNoteInput)} 
          className="btn btn-light btn-sm me-2 p-1"
        >
          <FaStickyNote size={16} />
        </button>
        <button 
          onClick={() => onCopyText(selectedText)} 
          className="btn btn-light btn-sm p-1"
        >
          <FaClipboard size={16} />
        </button>
      </div>

      {showColors && (
        <div className="position-absolute mt-1 bg-white rounded p-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <div className="d-flex gap-2">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => handleHighlight(color.value)}
                className="btn p-0 rounded"
                style={{ 
                  backgroundColor: color.value,
                  width: '24px',
                  height: '24px',
                  border: '1px solid #dee2e6'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {showNoteInput && (
        <div className="position-absolute mt-1 bg-white rounded p-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <div className="d-flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add note..."
              className="form-control form-control-sm"
              style={{ width: '150px' }}
            />
            <button
              onClick={handleStickyNote}
              className="btn btn-primary btn-sm"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextAnnotationPopup;