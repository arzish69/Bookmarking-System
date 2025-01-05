import React from "react";
import { getAuth, signOut } from "firebase/auth";
import { NavDropdown } from "react-bootstrap";
import axios from 'axios';  // Ensure axios is imported

const LogoutButton = () => {
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);  // Sign out from Firebase
      console.log("User signed out successfully.");

      // Call the syncLogoutWithBackend function to notify the backend
      await syncLogoutWithBackend(null, "loggedOut");

    } catch (error) {
      console.error("Error during logout:", error.message);
    }
  };

  const syncLogoutWithBackend = async (user, state) => {
    try {
      console.log("Sending request to backend..."); // Log before sending request

      const response = await axios.post('http://localhost:3000/sync-auth-state', {
        user: null,  // Send `null` for user since it's a logout state
        state: state  // Send the 'loggedOut' state
      });

      // Log the response from the backend
      console.log('Auth state synced:', response.data);
    } catch (error) {
      // Log any error that occurs during the request
      console.error('Failed to sync auth state with backend:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <NavDropdown.Item href="/" onClick={handleLogout}>
      Logout
    </NavDropdown.Item>
  );
};

export default LogoutButton;
