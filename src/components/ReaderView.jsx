import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDoc, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Spinner from "react-bootstrap/Spinner";
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import TextAnnotationPopup from "./TextAnnotationPopup"; // Import the popup component

const ReaderView = () => {
  const { urlId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [readingTime, setReadingTime] = useState(null);
  const [error, setError] = useState(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

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

  useEffect(() => {
    if (!user) return;

    const fetchContent = async () => {
      setLoading(true);
      try {
        const urlDocRef = doc(collection(db, "users", user.uid, "links"), urlId);
        const urlDoc = await getDoc(urlDocRef);

        if (urlDoc.exists()) {
          const urlData = urlDoc.data();
          setTitle(urlData.title);
          setOriginalUrl(urlData.url);

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
          throw new Error("URL document does not exist");
        }
      } catch (error) {
        console.error("Error fetching URL content:", error);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [user, urlId]);

  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    const text = selection.toString();
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

  const handleHighlight = (text) => {
    console.log(`Highlighting: "${text}"`);
    // Add highlight logic
  };

  const handleStickyNote = (noteText) => {
    console.log(`Sticky note for: "${selectedText}", Note: "${noteText}"`);
    // Add sticky note logic
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    console.log(`Copied: "${text}"`);
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
          <div style={styles.content}>{content}</div>
        )}
      </div>

      {popupVisible && (
        <TextAnnotationPopup
          selectedText={selectedText}
          position={popupPosition}
          onHighlight={handleHighlight}
          onStickyNote={handleStickyNote}
          onCopyText={handleCopyText}
        />
      )}
    </div>
  );
};

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
  error: {
    color: "red",
    textAlign: "center",
    marginTop: "20px",
  },
};

export default ReaderView;
