import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainNavbar from "../components/navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, addDoc, getDocs, deleteDoc, getDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import dustbinIcon from "../assets/dustbin.svg";

const Library = () => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState(""); // State for tags input
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingUrl, setProcessingUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false); // Tracks selection mode
  const [selectedBookmarks, setSelectedBookmarks] = useState([]); // Tracks selected bookmarks
  const [showShareModal, setShowShareModal] = useState(false); // Tracks if the share modal is visible
  const [userGroups, setUserGroups] = useState([]); // List of groups the user is part of
  const [selectedGroups, setSelectedGroups] = useState([]); // Selected groups for sharing
  const navigate = useNavigate();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState("");

  const sidebarItems = ["All", "Annotate", "AI Summarizer", "Organize"];

  const createLocalPdfUrl = (file) => {
    return URL.createObjectURL(file);
  };
  
  const handlePdfUpload = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      setMessage("Please select a PDF file");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const timestamp = new Date();
      const localPdfUrl = createLocalPdfUrl(pdfFile);

      // Save the PDF metadata to Firestore
      await addDoc(collection(db, "users", user.uid, "links"), {
        url: localPdfUrl,
        title: pdfName || pdfFile.name,
        type: "pdf",
        originalFileName: pdfFile.name,
        timestamp,
        tags: ["pdf"],
        isLocalPdf: true // Flag to identify local PDFs
      });

      setMessage("PDF added successfully");
      fetchSavedUrls(user);
      setPdfFile(null);
      setPdfName("");
      setShowPdfModal(false);
    } catch (error) {
      console.error("Error adding PDF:", error);
      setMessage("Error adding PDF");
    }
  };

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

  const handleBulkSelect = () => {
    if (selectionMode) {
      setSelectedBookmarks(urls.map((bookmark) => bookmark.id)); // Select all bookmarks
    } else {
      setMessage("Enable selection mode first.");
    }
  };
  

  const handleShareToGroup = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("User not authenticated.");
        setMessage("You need to be logged in to share bookmarks.");
        return;
      }
  
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userGroups = userDoc.data().groups || [];
  
        const groupList = await Promise.all(
          userGroups.map(async (groupId) => {
            const groupDoc = await getDoc(doc(db, "groups", groupId));
            return groupDoc.exists() ? { id: groupDoc.id, ...groupDoc.data() } : null;
          })
        );
  
        setUserGroups(groupList.filter((group) => group !== null)); // Filter out non-existent groups
        setShowShareModal(true); // Open the share modal
      } else {
        console.error("User document does not exist.");
        setMessage("Unable to fetch groups.");
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setMessage("Error fetching groups.");
    }
  };  
  

  const toggleGroupSelection = (groupId) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSendToGroups = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage("User not authenticated.");
        return;
      }
  
      const userId = user.uid; // Correct field for user ID
  
      // Fetch the user's document from Firestore
      const userDocRef = doc(db, "users", userId); // Reference to the user's document
      const userDoc = await getDoc(userDocRef);
  
      let username = "Anonymous"; // Default value if no username is found
      if (userDoc.exists()) {
        username = userDoc.data()?.username || "Anonymous"; // Get username or default
      } else {
        console.error("No such document for the user in Firestore!");
      }
  
      const timestamp = new Date();
      for (const groupId of selectedGroups) {
        for (const bookmarkId of selectedBookmarks) {
          const bookmark = urls.find((item) => item.id === bookmarkId);
          if (bookmark) {
            await addDoc(collection(db, "groups", groupId, "sharedUrls"), {
              sharedBy: username,
              sharedById: userId,
              timestamp,
              title: bookmark.title,
              url: bookmark.url,
            });
          }
        }
      }
  
      setMessage("Bookmarks shared successfully.");
      setShowShareModal(false); // Close the share modal
      setSelectedGroups([]); // Clear selected groups
      setSelectedBookmarks([]); // Clear selected bookmarks
      setSelectionMode(false); // Exit selection mode
    } catch (error) {
      console.error("Error sharing bookmarks:", error);
      setMessage("Error sharing bookmarks.");
    }
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

  const filteredUrls = urls.filter((saved) => {
    const searchString = searchTerm.toLowerCase();
    return (
      saved.url.toLowerCase().includes(searchString) ||
      (saved.title && saved.title.toLowerCase().includes(searchString)) ||
      (saved.originalFileName && saved.originalFileName.toLowerCase().includes(searchString))
    );
  });

  const navigateToReaderView = (saved) => {
    if (!selectionMode) {
      if (saved.isLocalPdf) {
        // Open PDF in new tab
        window.open(saved.url, '_blank');
      } else {
        // Regular bookmark navigation
        navigate(`/read/${saved.id}`);
      }
    }
  };

  const renderBookmarkItem = (saved, index) => {
    const bookmarkStyle = {
      backgroundColor: selectionMode && selectedBookmarks.includes(saved.id) ? "#c8fff7" : "white",
      cursor: selectionMode ? "pointer" : "default",
      width: "40%",
    };

    return (
      <li
        key={index}
        className="list-group-item d-flex flex-column justify-content-between align-items-start"
        style={bookmarkStyle}
        onClick={() => toggleBookmarkSelection(saved.id)}
      >
        <div className="d-flex w-100 justify-content-between">
          <div>
            <span
              style={{
                cursor: selectionMode ? "default" : "pointer",
                color: "blue",
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => !selectionMode && navigateToReaderView(saved)}
            >
              {saved.isLocalPdf && (
                <span 
                  style={{
                    backgroundColor: "#ff4444",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    marginRight: "8px",
                    fontSize: "12px"
                  }}
                >
                  PDF
                </span>
              )}
              {saved.title || saved.originalFileName || saved.url}
            </span>
          </div>
          <span className="text-muted ml-2">
            {new Date(saved.timestamp?.seconds * 1000).toLocaleString()}
          </span>
        </div>
        {/* Tags Display */}
        <div style={{ fontSize: "12px", color: "gray", marginTop: "5px" }}>
          {saved.tags?.map((tag, idx) => (
            <span
              key={idx}
              style={{
                display: "inline-block",
                backgroundColor: "#f0f0f0",
                borderRadius: "3px",
                padding: "2px 6px",
                marginRight: "5px",
                marginBottom: "5px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        {!selectionMode && (
          <div style={{ marginTop: "10px", alignSelf: "flex-end" }}>
            <img
              src={dustbinIcon}
              alt="Delete"
              style={{ width: "20px", cursor: "pointer" }}
              onClick={() => handleDelete(saved.url)}
              disabled={processingUrl === saved.url}
            />
          </div>
        )}
      </li>
    );
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
      const tagsArray = tags.split(" ").filter((tag) => tag.trim() !== ""); // Split tags by space

      await addDoc(collection(db, "users", user.uid, "links"), {
        url: encodedUrl,
        title,
        tags: tagsArray,
        timestamp,
      });

      setMessage("Webpage URL saved successfully.");
      fetchSavedUrls(user);
    } catch (error) {
      console.error("Error saving the webpage:", error);
      setMessage("Error saving the webpage.");
    }

    setUrl("");
    setTitle("");
    setTags(""); // Reset tags input
    setShowModal(false); // Close the modal
  };

  const pdfUploadModal = (
    <Modal show={showPdfModal} onHide={() => setShowPdfModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add PDF Bookmark</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handlePdfUpload}>
          <div className="form-group">
            <label htmlFor="pdfName">Title (optional):</label>
            <input
              type="text"
              className="form-control"
              id="pdfName"
              value={pdfName}
              onChange={(e) => setPdfName(e.target.value)}
              placeholder="Enter a title for the PDF"
            />
          </div>
          <div className="form-group mt-3">
            <label htmlFor="pdfFile">PDF File:</label>
            <input
              type="file"
              className="form-control"
              id="pdfFile"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
              required
            />
          </div>
          <Button type="submit" className="btn btn-primary mt-3">
            Add PDF
          </Button>
        </form>
      </Modal.Body>
    </Modal>
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

      <div className="container" style={{ maxWidth: "1260px", marginLeft: "270px", marginTop: "80px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: "380px" }}>
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          style={{ marginRight: "10px" }}
        >
          Add a Bookmark
        </Button>
        <Button
          variant="primary"
          onClick={() => setShowPdfModal(true)}
          style={{ marginRight: "10px" }}
        >
          Add PDF
        </Button>
        <Button variant="primary" onClick={handleToggleSelectionMode}>
          {selectionMode ? "Exit Selection" : "Select"}
        </Button>
      </div>
        <div className="d-flex justify-content-between align-items-center">
          <h1>Saved Bookmarks</h1>
        </div>
        <ul className="list-group mt-3">
        {filteredUrls.map((saved, index) => {
          const bookmarkStyle = {
            backgroundColor:
              selectionMode && selectedBookmarks.includes(saved.id) ? "#c8fff7" : "white",
            cursor: selectionMode ? "pointer" : "default",
            width: "40%",
          };

          return (
            <li
              key={index}
              className="list-group-item d-flex flex-column justify-content-between align-items-start"
              style={bookmarkStyle}
              onClick={() => toggleBookmarkSelection(saved.id)}
            >
              <div className="d-flex w-100 justify-content-between">
                <span
                  style={{
                    cursor: selectionMode ? "default" : "pointer",
                    color: "blue",
                  }}
                  onClick={() => !selectionMode && navigateToReaderView(saved)}
                >
                  {saved.title || saved.url}
                </span>
                <span className="text-muted ml-2">
                  {new Date(saved.timestamp?.seconds * 1000).toLocaleString()}
                </span>
              </div>
              {/* Tags Display */}
              <div style={{ fontSize: "12px", color: "gray", marginTop: "5px" }}>
                {saved.tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: "inline-block",
                      backgroundColor: "#f0f0f0",
                      borderRadius: "3px",
                      padding: "2px 6px",
                      marginRight: "5px",
                      marginBottom: "5px",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {!selectionMode && (
                <div style={{ marginTop: "10px", alignSelf: "flex-end" }}>
                  <img
                    src={dustbinIcon}
                    alt="Delete"
                    style={{ width: "20px", cursor: "pointer" }}
                    onClick={() => handleDelete(saved.url)}
                    disabled={processingUrl === saved.url}
                  />
                </div>
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
            <div className="form-group">
              <label htmlFor="tags">Tags (separate with spaces):</label>
              <input
                type="text"
                className="form-control"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., work research personal"
              />
            </div>
            <Button type="submit" className="btn btn-primary mt-3">
              Save Webpage
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      <Modal show={showPdfModal} onHide={() => setShowPdfModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add PDF Bookmark</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handlePdfUpload}>
            <div className="form-group">
              <label htmlFor="pdfName">Title (optional):</label>
              <input
                type="text"
                className="form-control"
                id="pdfName"
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                placeholder="Enter a title for the PDF"
              />
            </div>
            <div className="form-group mt-3">
              <label htmlFor="pdfFile">PDF File:</label>
              <input
                type="file"
                className="form-control"
                id="pdfFile"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                required
              />
            </div>
            <Button type="submit" className="btn btn-primary mt-3">
              Add PDF
            </Button>
            </form>
        </Modal.Body>
      </Modal>

      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Share to Groups</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <div style={{ maxHeight: "300px", overflowY: "auto", padding: "0" }}>
          {userGroups.length > 0 ? (
            <ul
              className="list-group"
              style={{
                width: "100%",
                margin: "0",
                padding: "0",
                border: "1px solid #ddd",
                borderRadius: "2px",
              }}
            >
              {userGroups.map((group) => (
                <li
                  key={group.id}
                  style={{
                    ...styles.listGroupItem,
                    ...(selectedGroups.includes(group.id) ? styles.groupItemActive : {}),
                    
                  }}
                  onClick={() => toggleGroupSelection(group.id)}
                >
                  {group.groupName}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ textAlign: "center" }}>No groups found.</p>
          )}
        </div>
      </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowShareModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendToGroups}>
            Send
          </Button>
        </Modal.Footer>
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

      {selectionMode && selectedBookmarks.length >= 0 && (
        <div style={styles.footer}>
          <span>{selectedBookmarks.length} item(s) selected</span>
          <Button
            variant="secondary"
            onClick={handleBulkSelect}
            style={{ marginLeft: "15px" }}
          >
            Bulk Select
          </Button>
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
  listGroupItem: {
    width: "100%", // Ensure full-width items
    padding: "10px 15px", // Add proper spacing
    cursor: "pointer", // Highlight items on hover
    overflow: "hidden", // Prevent text overflow
    whiteSpace: "nowrap", // Keep text in a single line
    textOverflow: "ellipsis", // Add ellipsis for overflowed text
    backgroundColor: "#fff", // Default background
    borderBottom: "1px solid #ddd", // Add subtle separation
    
  },
  groupItemActive: {
    backgroundColor: "lightblue",
    color: "black",
  },
};

export default Library;
