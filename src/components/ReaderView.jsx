import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, getDoc, doc } from "firebase/firestore"; // Firebase imports
import { db, auth } from "../firebaseConfig"; // Firebase configuration
import Spinner from "react-bootstrap/Spinner";
import { Button } from "react-bootstrap"; // Optional: use Bootstrap for styling

const ReaderView = () => {
  const { urlId } = useParams(); // Get URL ID from route parameters
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(""); // Store the fetched content
  const [readingIndex, setReadingIndex] = useState(0); // Index of the current word being read
  const [isReading, setIsReading] = useState(false); // Track reading state

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
          const extractedContent = await fetchTextFromUrl(urlData.url);
          setContent(extractedContent);
        }
      } catch (error) {
        console.error("Error fetching URL content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [urlId]);

  // Function to fetch text content from a URL
  const fetchTextFromUrl = async (url) => {
    try {
      const response = await fetch(url);
      const text = await response.text();

      // Optional: Extract only the text content (you can use a library like cheerio for better extraction)
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(text, "text/html");
      return htmlDoc.body.innerText; // Return only the body text
    } catch (error) {
      console.error("Error fetching text content:", error);
      return "Failed to fetch content.";
    }
  };

  // Function to start reading
  const handleStartReading = () => {
    setIsReading(true);
    setReadingIndex(0);
  };

  // Function to stop reading
  const handleStopReading = () => {
    setIsReading(false);
  };

  // Speed reading logic using a timer
  useEffect(() => {
    let timer;
    if (isReading && content) {
      const words = content.split(" "); // Split content into words
      timer = setInterval(() => {
        setReadingIndex((prevIndex) => {
          if (prevIndex < words.length - 1) {
            return prevIndex + 1;
          } else {
            clearInterval(timer);
            return prevIndex; // Stop at the last word
          }
        });
      }, 200); // Adjust the reading speed (milliseconds per word)
    }

    return () => clearInterval(timer);
  }, [isReading, content]);

  return (
    <div className="container mt-5">
      <h2>Reader View</h2>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <div>
          <p>
            {/* Display text content up to the current reading index */}
            {content
              .split(" ")
              .slice(0, readingIndex + 1)
              .join(" ")}
          </p>
          <div className="mt-4">
            <Button variant="success" onClick={handleStartReading} disabled={isReading}>
              Start Reading
            </Button>
            <Button variant="danger" onClick={handleStopReading} disabled={!isReading} className="ml-3">
              Stop Reading
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderView;
