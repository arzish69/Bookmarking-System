import React, { useState, useEffect } from "react";
import MainNavbar from "./main_navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore"; 
import { db, auth } from "../firebaseConfig"; 
import Spinner from "react-bootstrap/Spinner";
import dustbinIcon from "../assets/dustbin.svg"; // Adjust the path to your SVG accordingly

const SideNav = () => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState(""); 
  const [message, setMessage] = useState("");
  const [urls, setUrls] = useState([]); // Initially, set as an empty array
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingUrl, setProcessingUrl] = useState(null); 

  const sidebarItems = [
    "All",
    "Annotate",
    "AI Summarizer",
    "Organize",
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // Fetch URLs for the logged-in user
        fetchSavedUrls(user);
      } else {
        // Clear state when logged out
        setUrls([]);
        localStorage.removeItem("savedUrls");
      }
    });

    // Cleanup the subscription
    return () => unsubscribe();
  }, []);

  // Function to fetch saved URLs from Firestore for the current user
  const fetchSavedUrls = async (user) => {
    setLoading(true);
    try {
      if (!user) return; // Ensure the user exists

      const querySnapshot = await getDocs(collection(db, "users", user.uid, "links"));
      const savedUrls = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setUrls(savedUrls);
      localStorage.setItem("savedUrls", JSON.stringify(savedUrls)); // Store in localStorage
    } catch (error) {
      console.error("Error fetching URLs:", error);
      setMessage("Error fetching URLs.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle form submission (save URL with timestamp)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const encodedUrl = encodeURI(url);

    const urlPattern = new RegExp("^(https?:\\/\\/)?([\\w.-]+)+(\\/[\\w- ./?%&=]*)?$");
    if (!urlPattern.test(encodedUrl)) {
      setMessage("Invalid URL format.");
      return;
    }

    if (urls.some((saved) => saved.url === encodedUrl)) {
      setMessage("This URL has already been saved.");
      return;
    }

    setProcessingUrl(encodedUrl);

    try {
      const user = auth.currentUser;
      if (!user) return;

      const timestamp = new Date(); // Save the current timestamp

      await addDoc(collection(db, "users", user.uid, "links"), { 
        url: encodedUrl, 
        title, 
        timestamp 
      });

      setMessage("Webpage URL saved successfully.");
      fetchSavedUrls(user); // Fetch updated URLs for the current user
    } catch (error) {
      console.error("Error saving webpage:", error);
      setMessage("Error saving webpage.");
    } finally {
      setProcessingUrl(null);
    }

    setUrl("");
    setTitle("");
  };

  const handleDelete = async (urlToDelete) => {
    setProcessingUrl(urlToDelete);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const querySnapshot = await getDocs(collection(db, "users", user.uid, "links"));
      const docToDelete = querySnapshot.docs.find(doc => doc.data().url === urlToDelete);

      if (docToDelete) {
        await deleteDoc(doc(db, "users", user.uid, "links", docToDelete.id));
        setMessage("URL deleted successfully.");
        fetchSavedUrls(user);
      } else {
        setMessage("URL not found.");
      }
    } catch (error) {
      console.error("Error deleting URL:", error);
      setMessage("Error deleting URL.");
    } finally {
      setProcessingUrl(null);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredSidebarItems = sidebarItems.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUrls = urls.filter(saved =>
    saved.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <MainNavbar />
      <div style={styles.sidebar}>
        <h3>Navigation</h3>
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <ul className="list-group mt-3">
          {filteredSidebarItems.length > 0 ? (
            filteredSidebarItems.map((item, index) => (
              <li key={index} className="list-group-item">
                {item}
              </li>
            ))
          ) : (
            <li className="list-group-item">No items found</li>
          )}
        </ul>
      </div>

      <div className="container" style={{ marginLeft: "270px", marginTop: "80px" }}>
        <h1>Paste Your Link</h1>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              className="form-control"
              style={{ width: "50%" }}
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for the webpage"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="url">URL:</label>
            <input
              type="url"
              className="form-control"
              style={{ width: "50%" }}
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter the webpage URL"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary mt-3">
            Save Webpage
          </button>
        </form>

        {message && (
          <div
            className={`alert mt-4 ${message.includes("Error") ? "alert-danger" : "alert-info"}`}
            style={{ width: "50%" }}
            role="alert"
          >
            {message}
          </div>
        )}

        <h2 className="mt-5">Saved URLs</h2>
        <ul className="list-group mt-3">
          {filteredUrls.map((saved, index) => (
            <li
              key={index}
              style={{ width: "50%" }}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <a href={saved.url} target="_blank" rel="noopener noreferrer">
                {saved.title || saved.url}
              </a>
              <span className="text-muted ml-2">
                {new Date(saved.timestamp?.seconds * 1000).toLocaleString()} {/* Display timestamp */}
              </span>
              {processingUrl === saved.url && (
                <Spinner animation="border" size="sm" variant="primary" className="ml-2" />
              )}
              <img
                src={dustbinIcon}
                alt="Delete"
                style={{ width: "20px", cursor: "pointer" }} // Adjust size if needed
                onClick={() => handleDelete(saved.url)}
                disabled={processingUrl === saved.url} // Disabled condition
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

const styles = {
  sidebar: {
    width: "250px",
    height: "100vh",
    backgroundColor: "#f8f9fa",
    padding: "15px",
    position: "fixed",
    top: "60px",
    left: "0",
    overflowY: "auto",
  },
};

export default SideNav;
