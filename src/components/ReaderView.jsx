import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDoc, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Spinner from "react-bootstrap/Spinner";
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import TextAnnotationPopup from "./TextAnnotationPopup";
import rangy from 'rangy';
import 'rangy/lib/rangy-classapplier';
import 'rangy/lib/rangy-serializer';
import 'rangy/lib/rangy-selectionsaverestore';
import 'rangy/lib/rangy-textrange';
import { 
  saveAnnotation, 
  getAnnotations, 
  createHighlight,
  restoreHighlight,
  deleteAnnotation,
  applyAnnotationsToContent 
} from '../utils/annotationHandlers';

// Initialize rangy
if (!rangy.initialized) {
  rangy.init();
}

const ReaderView = () => {
  const { urlId } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [readingTime, setReadingTime] = useState(null);
  const [error, setError] = useState(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [showNotePopup, setShowNotePopup] = useState(false);
  
  // Popup state
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  // Auth effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Content and annotations loading effect
  useEffect(() => {
    if (!user) return;

    const fetchContentAndAnnotations = async () => {
      setLoading(true);
      try {
        // Fetch document content
        const urlDocRef = doc(collection(db, "users", user.uid, "links"), urlId);
        const urlDoc = await getDoc(urlDocRef);

        if (urlDoc.exists()) {
          const urlData = urlDoc.data();
          setTitle(urlData.title);
          setOriginalUrl(urlData.url);

          // Fetch content if not already stored
          if (!urlData.content) {
            const response = await fetch(
              `http://localhost:5000/readerview?url=${encodeURIComponent(urlData.url)}`
            );

            if (!response.ok) {
              throw new Error("Failed to fetch content from the backend");
            }

            const data = await response.json();
            if (data.error) {
              throw new Error(data.error);
            }

            setContent(data.content);
            setReadingTime(data.estimated_reading_time);

            await setDoc(
              urlDocRef,
              { ...urlData, content: data.content },
              { merge: true }
            );
          } else {
            setContent(urlData.content);
          }

          // Fetch annotations
          const fetchedAnnotations = await getAnnotations(user.uid, urlId);
          setAnnotations(fetchedAnnotations);
        } else {
          throw new Error("URL document does not exist");
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContentAndAnnotations();
  }, [user, urlId]);

  useEffect(() => {
    const handleClick = (event) => {
      if (event.target.classList.contains("highlighted")) {
        const annotationId = event.target.dataset.annotationId;
        const text = event.target.dataset.text;
        
        // Find the current annotation
        const annotation = annotations.find(a => a.id === annotationId);
        if (annotation) {
          setCurrentAnnotation(annotation);
        }
  
        // Set popup state
        const rect = event.target.getBoundingClientRect();
        setPopupPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
        setSelectedText(text);
        setPopupVisible(true);
      } else if (event.target.classList.contains("note-icon")) {
        const annotationId = event.target.dataset.annotationId;
        const note = event.target.dataset.note;
        
        // Show note content
        setNoteContent(note);
        setShowNotePopup(true);
        
        // Position the popup near the icon
        const rect = event.target.getBoundingClientRect();
        setPopupPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
    };
  
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [annotations]); 
  
  // ADD THE NEW RESTORATION EFFECT HERE
  useEffect(() => {
    if (content && annotations.length > 0) {
      // Clear any existing highlights first
      const contentDiv = contentRef.current;
      if (!contentDiv) return;
      
      // Restore all annotations
      annotations.forEach(annotation => {
        restoreHighlight(annotation);
      });
    }
  }, [content, annotations]);

  // Text selection handler
  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const popupPosition = {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      };

      setSelectedText(text);
      setPopupPosition(popupPosition);
      setPopupVisible(true);
    } else {
      setPopupVisible(false);
    }
  };

  // Annotation handlers
  const handleHighlight = async (text, color) => {
    try {
      console.log("Attempting to highlight:", text, color); // Debug log
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        console.log("No valid selection"); // Debug log
        return;
      }
  
      const highlightInfo = createHighlight(color, selection);
      console.log("Highlight info:", highlightInfo); // Debug log
      
      if (!highlightInfo) {
        console.log("No highlight info created"); // Debug log
        return;
      }
  
      const annotation = {
        ...highlightInfo,
        note: '',
      };
  
      const annotationId = await saveAnnotation(user.uid, urlId, annotation);
      setAnnotations(prev => [...prev, { ...annotation, id: annotationId }]);
      setPopupVisible(false);
    } catch (error) {
      console.error('Error in handleHighlight:', error);
    }
  };

  const handleStickyNote = async (text, noteText) => {
    try {
      const selection = rangy.getSelection();
      const highlightInfo = createHighlight('yellow', selection); // Default color for notes
      
      if (!highlightInfo) return;
  
      const annotation = {
        ...highlightInfo,
        note: noteText,
      };
  
      const annotationId = await saveAnnotation(user.uid, urlId, annotation);
      setAnnotations(prev => [...prev, { ...annotation, id: annotationId }]);
      setPopupVisible(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setPopupVisible(false);
  };

  // Render content with annotations
  const renderContent = () => {
    if (!content) return null;
    
    const annotatedContent = applyAnnotationsToContent(content, annotations);
    return (
      <div 
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: annotatedContent }}
        style={styles.content}
      />
    );
  };

  if (!user) {
    return <Spinner animation="border" />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <button style={styles.backButton} onClick={() => navigate("/library")}>
          <FaArrowLeft size={20} />
        </button>
        <div style={styles.navContent}>
          <h3 style={styles.title}>{title || "Loading..."}</h3>
          {readingTime && <p style={styles.readingTime}>Estimated Time: {readingTime} min</p>}
        </div>
        {originalUrl && (
          <a href={originalUrl} target="_blank" rel="noopener noreferrer" style={styles.linkIcon}>
            <FaExternalLinkAlt size={20} />
          </a>
        )}
      </div>

      <div style={styles.contentBox} onMouseUp={handleTextSelection}>
      {loading ? (
        <Spinner animation="border" />
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : (
        renderContent()
      )}
    </div>

    {popupVisible && (
      <TextAnnotationPopup
        selectedText={selectedText}
        position={popupPosition}
        currentColor="rgba(255, 255, 0, 0.3)"
        onHighlight={handleHighlight}
        onStickyNote={handleStickyNote}
        onCopyText={handleCopyText}
      />
    )}

    {/* Add the note popup here, just before the closing div */}
    {showNotePopup && (
      <div 
        style={{
          ...styles.notePopup,
          top: popupPosition.top,
          left: popupPosition.left
        }}
      >
        <div style={styles.noteContent}>
          {noteContent}
        </div>
        <button 
          style={styles.closeButton}
          onClick={() => setShowNotePopup(false)}
        >
          Close
        </button>
      </div>
    )}
    </div>
  );
};

// Styles remain the same as in your original component
const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
  },
  navbar: {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    backgroundColor: "#007bff",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  contentBox: {
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    position: "relative",
  },
  content: {
    fontSize: "16px",
    lineHeight: "1.6",
  },
  linkIcon: {
    color: "#fff",
    marginLeft: "10px",
    cursor: "pointer",
    fontSize: "20px",
  },
  backButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  navContent: {
    marginLeft: "20px",
    flexGrow: 1,
  },
  title: {
    color: "#fff",
    margin: 0,
  },
  readingTime: {
    color: "#fff",
    fontSize: "14px",
  },
  header: {
    fontSize: "24px",
    marginBottom: "20px",
    textAlign: "center",
    position: "relative",
  },
  button: {
    position: "absolute",
    top: "20px",
    right: "20px",
    padding: "8px 16px",
    fontSize: "16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  notePopup: {
    position: 'absolute',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: 1000,
    maxWidth: '300px',
    maxHeight: '200px',
    overflow: 'auto'
  },
  noteContent: {
    marginBottom: '10px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  closeButton: {
    padding: '4px 8px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: "20px",
  },
};

export default ReaderView;