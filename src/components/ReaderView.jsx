import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, getDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import Spinner from "react-bootstrap/Spinner";

const ReaderView = () => {
  const { urlId } = useParams();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [error, setError] = useState(null);
  const [originalUrl, setOriginalUrl] = useState("");

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;

        const urlDocRef = doc(collection(db, "users", user.uid, "links"), urlId);
        const urlDoc = await getDoc(urlDocRef);

        if (urlDoc.exists()) {
          const urlData = urlDoc.data();
          setOriginalUrl(urlData.url);

          const response = await fetch(`http://localhost:5000/proxy?url=${encodeURIComponent(urlData.url)}`);
          const data = await response.json();

          if (data.content) {
            setContent(data.content);
          } else {
            throw new Error("No content available");
          }
        }
      } catch (error) {
        console.error("Error fetching URL content:", error);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [urlId]);

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
