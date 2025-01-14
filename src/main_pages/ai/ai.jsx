import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import MainNavbar from "../main_navbar";

const Ai = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [manualInput, setManualInput] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

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
  if (isUrl && !isValidHttpUrl(textOrUrl)) {
    console.error("Invalid URL passed for summarization:", textOrUrl);
    setSummary("Invalid URL. Please try again.");
    return;
  }

  setLoading(true);
  setSummary(""); // Clear previous summary
  try {
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

    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

    const result = await response.json();
    setSummary(result.summary || "Summary not available.");
  } catch (error) {
    console.error("Error fetching summarized content:", error);
    setSummary("An error occurred. Please try again.");
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
        <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
          <h2 style={{ marginBottom: "10px" }}>Summarize Manually</h2>
          <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter text or URL..."
              style={{ padding: "8px", flex: 1, borderRadius: "4px", border: "1px solid #ccc" }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Summarize
            </button>
          </form>
        </div>

        {/* Saved Bookmarks Section */}
        <div style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
          <h2 style={{ marginBottom: "10px" }}>Saved Bookmarks</h2>
          {bookmarks.length === 0 ? (
            <p style={{ color: "#666" }}>No bookmarks saved yet</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {bookmarks.map((bookmark) => (
                <li
                  key={bookmark.id}
                  style={{
                    padding: "8px",
                    backgroundColor: "#f8f9fa",
                    marginBottom: "5px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => fetchSummarizedContent(bookmark.url, true)} // URL summarization
                >
                  <span style={{ color: "blue", textDecoration: "underline" }}>
                    {bookmark.title || bookmark.url}
                  </span>
                </li>
              ))}
            </ul>
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
