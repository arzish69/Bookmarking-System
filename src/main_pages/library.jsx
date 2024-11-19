import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainNavbar from "../main_pages/main_navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import dustbinIcon from "../assets/dustbin.svg";

const Library = () => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingUrl, setProcessingUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false); // Tracks selection mode
  const [selectedBookmarks, setSelectedBookmarks] = useState([]); // Tracks selected bookmarks
  const navigate = useNavigate();

  const sidebarItems = ["All", "Annotate", "AI Summarizer", "Organize"];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchSavedUrls(user);
      } else {
        setUrls([]);
        localStorage.removeItem("savedUrls");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSavedUrls = async (user) => {
    setLoading(true);
    try {
      if (!user) return;
      const querySnapshot = await getDocs(collection(db, "users", user.uid, "links"));
      const savedUrls = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setUrls(savedUrls);
      localStorage.setItem("savedUrls", JSON.stringify(savedUrls));
    } catch (error) {
      console.error("Error fetching URLs:", error);
      setMessage("Error fetching URLs.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    if (selectionMode) {
      setSelectedBookmarks([]); // Clear selections when exiting selection mode
    }
  };

  const toggleBookmarkSelection = (bookmarkId) => {
    if (!selectionMode) return;
    setSelectedBookmarks((prev) =>
      prev.includes(bookmarkId)
        ? prev.filter((id) => id !== bookmarkId)
        : [...prev, bookmarkId]
    );
  };

  const handleDeleteSelected = async () => {
    setProcessingUrl("bulk"); // Indicates bulk processing
    try {
      const user = auth.currentUser;
      if (!user) return;

      for (const bookmarkId of selectedBookmarks) {
        const docRef = doc(db, "users", user.uid, "links", bookmarkId);
        await deleteDoc(docRef);
      }

      setMessage(`${selectedBookmarks.length} item(s) deleted successfully.`);
      fetchSavedUrls(user); // Refresh the URLs after deletion
      setSelectedBookmarks([]); // Clear selection
    } catch (error) {
      console.error("Error deleting selected items:", error);
      setMessage("Error deleting selected items.");
    } finally {
      setProcessingUrl(null);
    }
  };

  const handleShareToGroup = () => {
    alert(`Sharing ${selectedBookmarks.length} item(s) to a group.`);
  };

  const handleDelete = async (urlToDelete) => {
    setProcessingUrl(urlToDelete);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const querySnapshot = await getDocs(collection(db, "users", user.uid, "links"));
      const docToDelete = querySnapshot.docs.find((doc) => doc.data().url === urlToDelete);
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

  const filteredSidebarItems = sidebarItems.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUrls = urls.filter((saved) =>
    saved.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigateToReaderView = (urlId) => {
    if (!selectionMode) {
      navigate(`/read/${urlId}`);
    }
  };

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

    try {
      const user = auth.currentUser;
      if (!user) return;

      const timestamp = new Date();
      await addDoc(collection(db, "users", user.uid, "links"), {
        url: encodedUrl,
        title,
        timestamp,
      });

      setMessage("Webpage URL saved successfully.");
      fetchSavedUrls(user); // Refresh the saved URLs list after adding
    } catch (error) {
      console.error("Error saving the webpage:", error);
      setMessage("Error saving the webpage.");
    }

    setUrl("");
    setTitle("");
    setShowModal(false); // Close the modal after submission
  };

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
        <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: "380px" }}>
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            style={{ marginRight: "10px" }}
          >
            Add a Bookmark
          </Button>
          <Button variant="primary" onClick={handleToggleSelectionMode}>
            {selectionMode ? "Exit Selection" : "Select"}
          </Button>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <h2>Saved Bookmarks</h2>
        </div>
        <ul className="list-group mt-3">
          {filteredUrls.map((saved, index) => {
            const bookmarkStyle = {
              backgroundColor:
                selectionMode && selectedBookmarks.includes(saved.id) ? "lightblue" : "white",
              cursor: selectionMode ? "pointer" : "default",
              width: "65%",
            };

            return (
              <li
                key={index}
                className="list-group-item d-flex justify-content-between align-items-center"
                style={bookmarkStyle}
                onClick={() => toggleBookmarkSelection(saved.id)}
              >
                <span
                  style={{
                    cursor: selectionMode ? "default" : "pointer",
                    color: "blue",
                  }}
                  onClick={() => !selectionMode && navigateToReaderView(saved.id)}
                >
                  {saved.title || saved.url}
                </span>
                <span className="text-muted ml-2">
                  {new Date(saved.timestamp?.seconds * 1000).toLocaleString()}
                </span>
                {!selectionMode && (
                  <img
                    src={dustbinIcon}
                    alt="Delete"
                    style={{ width: "20px", cursor: "pointer" }}
                    onClick={() => handleDelete(saved.url)}
                    disabled={processingUrl === saved.url}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add a Bookmark</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title:</label>
              <input
                type="text"
                className="form-control"
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
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter the webpage URL"
                required
              />
            </div>
            <Button type="submit" className="btn btn-primary mt-3">
              Save Webpage
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      {message && (
        <div
          className={`alert mt-4 ${message.includes("Error") ? "alert-danger" : "alert-info"}`}
          style={{ width: "50%", marginLeft: "270px" }}
          role="alert"
        >
          {message}
        </div>
      )}

      {selectionMode && selectedBookmarks.length > 0 && (
        <div style={styles.footer}>
          <span>{selectedBookmarks.length} item(s) selected</span>
          <Button
            variant="danger"
            onClick={handleDeleteSelected}
            style={{ marginLeft: "15px" }}
          >
            Delete Selected Items
          </Button>
          <Button
            variant="primary"
            onClick={handleShareToGroup}
            style={{ marginLeft: "15px" }}
          >
            Share to Group
          </Button>
        </div>
      )}
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
  footer: {
    position: "fixed",
    bottom: "0",
    left: "0",
    width: "100%",
    backgroundColor: "#f8f9fa",
    padding: "10px",
    boxShadow: "0px -2px 5px rgba(0, 0, 0, 0.1)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};

export default Library;
