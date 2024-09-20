// src/SideNav.js
import React, { useState, useEffect } from "react";
import MainNavbar from "./main_navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore"; // Firestore functions
import { db, auth } from "../firebaseConfig"; // Import Firestore and Auth

const SideNav = () => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState(""); 
  const [message, setMessage] = useState("");
  const [urls, setUrls] = useState([]);

  // Fetch URLs when component mounts
  useEffect(() => {
    fetchSavedUrls();
  }, []);

  // Function to fetch saved URLs from Firestore
  const fetchSavedUrls = async () => {
    try {
      const user = auth.currentUser; // Get the current authenticated user
      if (!user) return; // Exit if no user is authenticated

      // Fetch URLs from the 'links' subcollection inside the 'users' collection
      const querySnapshot = await getDocs(collection(db, "users", user.uid, "links"));
      const savedUrls = querySnapshot.docs.map((doc) => doc.data());
      setUrls(savedUrls);
    } catch (error) {
      console.error("Error fetching URLs:", error);
    }
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = auth.currentUser; // Get the current authenticated user
      if (!user) return;

      // Save the URL and title to Firestore in the 'links' subcollection
      await addDoc(collection(db, "users", user.uid, "links"), {
        url,
        title,
      });

      setMessage("Webpage URL saved successfully");
      fetchSavedUrls(); // Fetch URLs again to update the list
    } catch (error) {
      console.error("Error saving webpage:", error);
      setMessage("Error saving webpage.");
    }

    setUrl("");
    setTitle("");
  };

  // Function to handle URL deletion
  const handleDelete = async (urlToDelete) => {
    try {
      const user = auth.currentUser; // Get the current authenticated user
      if (!user) return;

      // Query Firestore to find the matching document in the 'links' subcollection
      const querySnapshot = await getDocs(collection(db, "users", user.uid, "links"));
      querySnapshot.forEach(async (docSnapshot) => {
        if (docSnapshot.data().url === urlToDelete) {
          await deleteDoc(doc(db, "users", user.uid, "links", docSnapshot.id));
        }
      });

      fetchSavedUrls(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting URL:", error);
    }
  };

  return (
    <>
      <MainNavbar />
      <div className="container mt-5">
        <h1>Paste Your Link</h1>
        <form onSubmit={handleSubmit} className="mt-4">
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
          {urls.map((saved, index) => (
            <li
              key={index}
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

export default SideNav;
