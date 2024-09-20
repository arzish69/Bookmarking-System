import React, { useState, useEffect } from "react";
import MainNavbar from "./main_navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { Collapse, Spinner } from "react-bootstrap";

const SideNav = () => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sidebar search state
  const [searchTerm, setSearchTerm] = useState("");

  // Sidebar items
  const sidebarItems = [
    "Dashboard",
    "Bookmarks",
    "Annotate PDFs",
    "AI Summarizer",
    "Organize",
    "Settings",
    "Help",
  ];

  // Fetch URLs when component mounts
  useEffect(() => {
    fetchSavedUrls();
  }, []);

  // Function to fetch saved URLs from the backend
  const fetchSavedUrls = async () => {
    setLoading(true); // Show loader
    try {
      const response = await fetch("http://localhost:3001/get-urls");
      const result = await response.json();
      setUrls(result.urls);
    } catch (error) {
      console.error("Error fetching URLs:", error);
      setMessage("Error fetching URLs.");
    } finally {
      setLoading(false); // Hide loader after fetch
    }
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate URL format using a basic regex
    const urlPattern = new RegExp(
      "^(https?:\\/\\/)?([\\w-]+\\.)+[\\w-]+(\\/[\\w- ./?%&=]*)?$"
    );
    if (!urlPattern.test(url)) {
      setMessage("Invalid URL format.");
      return;
    }

    // Check for duplicate URLs
    if (urls.some((saved) => saved.url === url)) {
      setMessage("This URL has already been saved.");
      return;
    }

    setLoading(true); // Show loading during submission
    try {
      const response = await fetch("http://localhost:3001/save-webpage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, title }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message);
        fetchSavedUrls(); // Fetch URLs again to update the list
      } else {
        setMessage("Failed to save webpage.");
      }
    } catch (error) {
      console.error("Error saving webpage:", error);
      setMessage("Error saving webpage.");
    } finally {
      setLoading(false); // Hide loader
    }

    setUrl(""); // Clear input field after submission
    setTitle(""); // Clear title field
  };

  // Function to handle URL deletion
  const handleDelete = async (urlToDelete) => {
    setLoading(true); // Show loading during deletion
    try {
      const response = await fetch("http://localhost:3001/delete-url", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToDelete }),
      });

      if (response.ok) {
        setUrls(urls.filter((saved) => saved.url !== urlToDelete)); // Update state to remove the deleted URL from the list
        setMessage("Webpage URL deleted successfully.");
      } else {
        setMessage("Failed to delete URL.");
      }
    } catch (error) {
      console.error("Error deleting URL:", error);
      setMessage("Error deleting URL.");
    } finally {
      setLoading(false); // Hide loader after deletion
    }
  };

  // Handle sidebar search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Filter sidebar items based on search term
  const filteredSidebarItems = sidebarItems.filter((item) =>
    item.toLowerCase().includes(searchTerm)
  );

  // Filter saved URLs based on search term (optional enhancement)
  const filteredUrls = urls.filter(
    (saved) =>
      saved.title.toLowerCase().includes(searchTerm) ||
      saved.url.toLowerCase().includes(searchTerm)
  );

  return (
    <>
      <MainNavbar />

      {/* Sidebar Section */}
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

      {/* Main Content */}
      <div
        className="container"
        style={{ marginLeft: "270px", marginTop: "80px" }}
      >
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

        {/* Display success or error message */}
        {message && (
          <div
            className={`alert mt-4 ${
              message.includes("Error") ? "alert-danger" : "alert-info"
            }`}
            style={{ width: "50%" }}
            role="alert"
          >
            {message}
          </div>
        )}

        {/* Display loading spinner */}
        {loading && <Spinner animation="border" variant="primary" />}

        {/* Display list of saved URLs */}
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
