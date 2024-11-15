import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDoc, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Spinner from "react-bootstrap/Spinner";

// Sanitize content to ensure compatibility with Firestore
const sanitizeContent = (content) => {
  return content
    .map((item) => {
      if (item.type === "text") {
        // Ensure only valid text is saved
        return { type: "text", html: item.html || "" };
      } else if (item.type === "image") {
        // Ensure only valid image URLs are saved
        return { type: "image", src: item.src || "" };
      }
      return null; // Exclude unsupported types
    })
    .filter(Boolean); // Remove null or invalid entries
};

const ReaderView = () => {
  const { urlId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [error, setError] = useState(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        navigate("/login"); // Redirect to login page if user is not authenticated
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
          setOriginalUrl(urlData.url);

          // Check if processed content is already in Firebase
          if (urlData.content) {
            console.log("Content fetched from Firebase cache");
            setContent(urlData.content);
          } else {
            // Fallback to fetching from backend `/proxy`
            console.log("Fetching content from /proxy");
            const response = await fetch(`http://localhost:5000/proxy?url=${encodeURIComponent(urlData.url)}`);
            const data = await response.json();

            if (data.content) {
              // Sanitize the content
              const sanitizedContent = sanitizeContent(data.content);
              setContent(sanitizedContent);

              // Save sanitized content back to Firebase
              await setDoc(urlDocRef, { ...urlData, content: sanitizedContent }, { merge: true });
              console.log("Sanitized content saved to Firebase");
            } else {
              throw new Error("No content available from /proxy");
            }
          }
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

  if (!user) {
    return <Spinner animation="border" />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Reader View</h2>
        {originalUrl && (
          <button
            style={styles.button}
            onClick={() => window.open(originalUrl, "_blank")}
          >
            View Original
          </button>
        )}
      </div>
      {loading ? (
        <Spinner animation="border" />
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : (
        <div style={styles.content}>
          {content.map((item, index) => {
            if (item.type === "text") {
              return (
                <div
                  key={index}
                  style={styles.paragraph}
                  dangerouslySetInnerHTML={{ __html: item.html }}
                />
              );
            } else if (item.type === "image") {
              return <img key={index} src={item.src} alt="" style={styles.image} />;
            }
            return null;
          })}
        </div>
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
  content: {
    fontSize: "18px",
    lineHeight: "1.6",
    color: "#333",
  },
  paragraph: {
    margin: "10px 0",
  },
  image: {
    maxWidth: "100%",
    height: "auto",
    borderRadius: "4px",
    margin: "10px 0",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: "20px",
  },
};

export default ReaderView;
