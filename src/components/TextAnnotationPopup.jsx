import React, { useState, useEffect } from "react";
import { FaHighlighter, FaStickyNote, FaClipboard } from "react-icons/fa";

const TextAnnotationPopup = ({ selectedText, onHighlight, onStickyNote, onCopyText, position }) => {
  const [noteText, setNoteText] = useState("");

  const handleNoteChange = (e) => setNoteText(e.target.value);

  return (
    <div style={{ ...styles.popup, top: position.top, left: position.left }}>
      <button onClick={() => onHighlight(selectedText)} style={styles.iconButton}>
        <FaHighlighter size={20} />
      </button>
      <button style={styles.iconButton} onClick={() => onStickyNote(noteText)}>
        <FaStickyNote size={20} />
      </button>
      <input
        type="text"
        placeholder="Add a note..."
        value={noteText}
        onChange={handleNoteChange}
        style={styles.noteInput}
      />
      <button onClick={() => onCopyText(selectedText)} style={styles.iconButton}>
        <FaClipboard size={20} />
      </button>
    </div>
  );
};

const styles = {
  popup: {
    position: "absolute",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "10px",
    boxShadow: "0 0 5px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
  },
  iconButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    marginRight: "10px",
  },
  noteInput: {
    width: "150px",
    padding: "5px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginRight: "10px",
  },
};

export default TextAnnotationPopup;
