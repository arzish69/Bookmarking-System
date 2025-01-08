import React, { useState, useRef } from 'react';
import { FaStickyNote, FaClipboard } from 'react-icons/fa';

const HIGHLIGHT_COLORS = [
  { name: 'yellow', value: 'rgba(255, 255, 0, 0.62)' },
  { name: 'green', value: '#D4FF32' },
  { name: 'pink', value: '#ff659f' },
  { name: 'blue', value: '#67dfff' },
  { name: 'orange', value: 'rgba(255, 166, 0, 0.71)' }
];

const TextAnnotationPopup = ({
  selectedText,
  position,
  onHighlight,
  onStickyNote,
  onCopyText,
  currentColor = HIGHLIGHT_COLORS[0].value // Default to first color
}) => {
  const [showColors, setShowColors] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const hideTimeout = useRef(null);

  const handleHighlight = (color) => {
    onHighlight(selectedText, color);
    setShowColors(false);
  };

  const handleStickyNote = () => {
    onHighlight(selectedText, currentColor);
    onStickyNote(selectedText, noteText);
    setShowNoteInput(false);
    setNoteText('');
  };

  const handleMouseEnter = () => {
    // Clear any existing timeout to prevent hiding
    clearTimeout(hideTimeout.current);
    setShowColors(true);
  };

  const handleMouseLeave = () => {
    // Set a timeout to hide the dropdown after a small delay
    hideTimeout.current = setTimeout(() => {
      setShowColors(false);
    }, 300); // Delay in milliseconds
  };

  const popupStyle = {
    position: 'fixed',
    top: position.top,
    left: position.left,
    zIndex: 1000
  };

  return (
    <div style={popupStyle}>
      <div
        className="d-flex align-items-center bg-white rounded p-2"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
      >
        <div
          className="position-relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ display: 'inline-block' }}
        >
          <button
            onClick={() => handleHighlight(currentColor)} // Click main color
            className="btn btn-light btn-sm me-2 p-1"
            style={{
              width: '24px',
              height: '24px',
              padding: '0',
              backgroundColor: currentColor,
              border: '1px solid #dee2e6'
            }}
          />
          {showColors && (
            <div
              className="position-absolute mt-1 bg-white rounded p-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column', // Vertical arrangement
                gap: '4px',
                boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)'
              }}
            >
              {HIGHLIGHT_COLORS.filter((color) => color.value !== currentColor).map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleHighlight(color.value)} // Click other colors
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
          )}
        </div>
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

      {showNoteInput && (
        <div
          className="position-absolute mt-1 bg-white rounded p-2"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
        >
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
