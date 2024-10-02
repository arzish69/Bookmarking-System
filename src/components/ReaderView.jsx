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

          // Use the backend proxy to fetch content instead of direct URL fetch
          const response = await fetch(`http://localhost:5000/proxy?url=${encodeURIComponent(urlData.url)}`);
          const { content: fetchedContent } = await response.json(); // Expect JSON response with content

          setContent(fetchedContent); // Set the fetched HTML content
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
        <div
          style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "5px", backgroundColor: "#f8f9fa" }}
          dangerouslySetInnerHTML={{ __html: content }} // Use dangerouslySetInnerHTML to render the HTML content
        />
      )}
    </div>
  );
};

export default ReaderView;
