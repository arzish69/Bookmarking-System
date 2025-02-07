import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import MainNavbar from "../main_navbar";

const Ai = () => {
    const [bookmarks, setBookmarks] = useState([]);
    const [manualInput, setManualInput] = useState("");
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

  // Fetch bookmarks from Firebase
  useEffect(() => {
    const fetchBookmarks = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "links"));
        const savedBookmarks = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setBookmarks(savedBookmarks);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      }
    };

    fetchBookmarks();
  }, []);

  // Fetch summarized content
  const fetchSummarizedContent = async (textOrUrl, isUrl = false) => {
    const user = auth.currentUser;
    if (!user) return;

    if (isUrl && !isValidHttpUrl(textOrUrl)) {
      setError("Invalid URL. Please try again.");
      return;
    }

    setLoading(true);
    setSummary(""); // Clear previous summary
    setError(null);

    try {
      // For URLs, check if we already have the summary stored
      if (isUrl) {
        const bookmarkDoc = bookmarks.find(b => b.url === textOrUrl);
        if (bookmarkDoc && bookmarkDoc.id) {
          const urlDocRef = doc(collection(db, "users", user.uid, "links"), bookmarkDoc.id);
          const urlDoc = await getDoc(urlDocRef);

          if (urlDoc.exists() && urlDoc.data().summary) {
            setSummary(urlDoc.data().summary);
            setLoading(false);
            return;
          }
        }
      }

      // If no stored summary found or it's manual text input, fetch from backend
      const endpoint = isUrl
        ? `http://localhost:5000/summarize?url=${encodeURIComponent(textOrUrl)}`
        : "http://localhost:5000/summarize";

      const options = isUrl
        ? { method: "GET" }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textOrUrl }),
          };

      const response = await fetch(endpoint, options);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const summaryText = result.summary || "Summary not available.";
      setSummary(summaryText);

      // Store the summary in Firebase for URLs
      if (isUrl) {
        const bookmarkDoc = bookmarks.find(b => b.url === textOrUrl);
        if (bookmarkDoc && bookmarkDoc.id) {
          const urlDocRef = doc(collection(db, "users", user.uid, "links"), bookmarkDoc.id);
          await setDoc(
            urlDocRef,
            { 
              ...bookmarkDoc,
              summary: summaryText,
              lastSummarized: new Date().toISOString()
            },
            { merge: true }
          );
        }
      }
    } catch (error) {
      console.error("Error fetching summarized content:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

    // Helper function for URL validation
    const isValidHttpUrl = (url) => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
        return false;
    }
    };

  // Handle manual text submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      fetchSummarizedContent(manualInput); // Text summarization
      setManualInput(""); // Clear the input
    }
  };

  return (
    <>
      <MainNavbar />
      <div style={{ maxWidth: "600px", margin: "20px auto", padding: "20px", marginTop: "80px" }}>
        {/* Manual Input Section */}

        {/* Saved Bookmarks Section */}
        <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
  <h2 style={{ marginBottom: "10px" }}>Saved Bookmarks</h2>
  {bookmarks.length === 0 ? (
    <p style={{ color: "#666" }}>No bookmarks saved yet</p>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: "0 0 5px", color: "#007bff" }}>
              {bookmark.title || "Untitled Bookmark"}
            </h4>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              style={{
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => fetchSummarizedContent(bookmark.url, true)}
            >
              Summarize
            </button>
            <button
              style={{
                padding: "5px 10px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => navigator.clipboard.writeText(bookmark.url)}
            >
              Copy Link
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        {/* Summary Display Section */}
        <div style={{ marginTop: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
          <h2>Summary</h2>
          {loading ? <p>Loading...</p> : <p>{summary || "No summary available yet."}</p>}
        </div>
      </div>
    </>
  );
};

export default Ai;
