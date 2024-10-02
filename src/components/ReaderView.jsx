import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, getDoc, doc } from "firebase/firestore"; // Firebase imports
import { db, auth } from "../firebaseConfig"; // Firebase configuration
import Spinner from "react-bootstrap/Spinner";

const ReaderView = () => {
  const { urlId } = useParams(); // Get URL ID from route parameters
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(""); // Store the fetched content

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        // Get current user ID
        const user = auth.currentUser;
        if (!user) return;

        // Fetch the URL document from Firestore
        const urlDocRef = doc(collection(db, "users", user.uid, "links"), urlId);
        const urlDoc = await getDoc(urlDocRef);

        if (urlDoc.exists()) {
          const urlData = urlDoc.data();

          // Use the backend proxy to fetch plain text content instead of direct URL fetch
          const response = await fetch(`http://localhost:5000/proxy?url=${encodeURIComponent(urlData.url)}`);
          const data = await response.json(); // Fetch the JSON object
          const fetchedContent = data.content; // Extract the content field from the response

          setContent(fetchedContent); // Set the plain text content
        }
      } catch (error) {
        console.error("Error fetching URL content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [urlId]);

  return (
    <div className="container mt-5">
      <h2>Reader View</h2>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <div style={{ whiteSpace: "pre-wrap", padding: "20px", lineHeight: "1.6" }}>
          {/* Display the plain text content */}
          {content}
        </div>
      )}
    </div>
  );
};

export default ReaderView;
