import React, { useState, useEffect } from "react";
import MainNavbar from "./main_navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore"; // Firestore functions
import { db, auth } from "../firebaseConfig"; // Import Firestore and Auth
import Spinner from "react-bootstrap/Spinner"; // Make sure to import Spinner

const SideNav = () => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState(""); 
  const [message, setMessage] = useState("");
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const sidebarItems = [
    "Dashboard",
    "Bookmarks",
    "Annotate PDFs",
    "AI Summarizer",
    "Organize",
    "Settings",
    "Help",
  ];

  useEffect(() => {
    fetchSavedUrls();
  }, []);

  const fetchSavedUrls = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const querySnapshot = await getDocs(collection(db, "users", user.uid, "links"));
      const savedUrls = querySnapshot.docs.map((doc) => doc.data());
      setUrls(savedUrls);
    } catch (error) {
      console.error("Error fetching URLs:", error);
      setMessage("Error fetching URLs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const urlPattern = new RegExp("^(https?:\\/\\/)?([\\w-]+\\.)+[\\w-]+(\\/[\\w- ./?%&=]*)?$");
    if (!urlPattern.test(url)) {
      setMessage("Invalid URL format.");
      return;
    }
    if (urls.some((saved) => saved.url === url)) {
      setMessage("This URL has already been saved.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(db, "users", user.uid, "links"), { url, title });
      setMessage("Webpage URL saved successfully");
      fetchSavedUrls();
    } catch (error) {
      console.error("Error saving webpage:", error);
      setMessage("Error saving webpage.");
    } finally {
      setLoading(false);
    }

    setUrl("");
    setTitle("");
  };

  const handleDelete = async (urlToDelete) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const querySnapshot = await getDocs(collection(db, "users", user.uid, "links"));
      querySnapshot.forEach(async (docSnapshot) => {
        if (docSnapshot.data().url === urlToDelete) {
          await deleteDoc(doc(db, "users", user.uid, "links", docSnapshot.id));
        }
      });

      fetchSavedUrls();
    } catch (error) {
      console.error("Error deleting URL:", error);
    } finally {
      setLoading(false);
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

        {loading && <Spinner animation="border" variant="primary" />}

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
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(saved.url)}
              >
                Delete
              </button>
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
