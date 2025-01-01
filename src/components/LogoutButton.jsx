// LogoutButton.jsx
import React from "react";
import { getAuth, signOut } from "firebase/auth";
import { NavDropdown } from "react-bootstrap";

const LogoutButton = () => {
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Error during logout:", error.message);
    }
  };

  return (
    <NavDropdown.Item href="/" onClick={handleLogout}>
      Logout
    </NavDropdown.Item>
  );
};

export default LogoutButton;
