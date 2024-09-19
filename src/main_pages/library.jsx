// src/SideNav.js
import React, { useState, useEffect } from "react";
import MainNavbar from "./main_navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { Collapse } from "react-bootstrap"; // Make sure react-bootstrap is installed

const SideNav = () => {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [urls, setUrls] = useState([]);

  // Fetch URLs when component mounts
  useEffect(() => {
    fetchSavedUrls();
  }, []);

  // Function to fetch saved URLs from the backend
  const fetchSavedUrls = async () => {
    try {
      const response = await fetch("http://localhost:3001/get-urls");
      const result = await response.json();
      console.log(result.urls); // Log the fetched URLs
      setUrls(result.urls);
    } catch (error) {
      console.error("Error fetching URLs:", error);
    }
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/save-webpage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
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
    }

    setUrl(""); // Clear input field after submission
  };

  // Function to handle URL deletion
  const handleDelete = async (urlToDelete) => {
    try {
      const response = await fetch("http://localhost:3001/delete-url", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToDelete }),
      });

      if (response.ok) {
        fetchSavedUrls(); // Refresh the list after deletion
      } else {
        console.error("Failed to delete URL");
      }
    } catch (error) {
      console.error("Error deleting URL:", error);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null); // Manage which dropdown is open

  const items = [
    { name: "Bookmarks", hasDropdown: false },
    {
      name: "Annotate PDFs",
      hasDropdown: true,
      subItems: ["Luxury", "Sport", "Casual"],
    },
    { name: "Organize", hasDropdown: false },
    {
      name: "AI Summarizer",
    },
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleDropdownToggle = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm)
  );

  return (
    <>
      <MainNavbar />
      <div className="container mt-5">
        <h1>Paste Your Link</h1>
        <form onSubmit={handleSubmit} className="mt-4">
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
          <button type="submit" className="btn btn-primary mt-3">
            Save Webpage
          </button>
        </form>

        {/* Display success or error message */}
        {message && (
          <div className="alert alert-info mt-4" role="alert">
            {message}
          </div>
        )}

        {/* Display list of saved URLs */}
        <h2 className="mt-5">Saved URLs</h2>
        <ul className="list-group mt-3">
          {urls.map((savedUrl, index) => (
            <li
              key={index}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <a href={savedUrl} target="_blank" rel="noopener noreferrer">
                {savedUrl}
              </a>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(savedUrl)}
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
  sideNav: {
    width: "250px",
    height: "calc(100vh - 56px)", // Adjust based on your navbar height
    backgroundColor: "#f8f9fa",
    position: "fixed",
    top: "56px", // Adjust based on your navbar height
    left: "0",
    overflowY: "auto",
    transition: "transform 0.3s ease",
  },
  filterContent: {
    padding: "15px",
  },
  listMenu: {
    listStyleType: "none",
    padding: "0",
  },
  chevron: {
    marginLeft: "auto",
    transition: "transform 0.3s ease",
  },
  dropdownMenu: {
    listStyleType: "none",
    padding: "0",
    margin: "0",
    paddingLeft: "15px",
  },
};

export default SideNav;
