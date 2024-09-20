// src/Navbar.js
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap"; // Import necessary components from react-bootstrap
import { auth } from "../firebaseConfig"; // Import Firebase auth
import { getFirestore, doc, getDoc } from "firebase/firestore";

const MainNavbar = () => {
  const [userName, setUserName] = useState(""); // Initialize with an empty string
  const db = getFirestore();

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid; // Get the user ID
        const userDocRef = doc(db, "users", userId); // Reference to the user document
        const userDoc = await getDoc(userDocRef); // Fetch the document

        if (userDoc.exists()) {
          // Get the username from the document
          setUserName(userDoc.data().username);
        } else {
          console.log("No such user document!");
        }
      }
    };

    fetchUserName();
  }, []);

  return (
    <Navbar bg="light" expand="lg" fixed="top">
      <Container>
        <Navbar.Brand href="#home">Clone</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="mx-auto">
            <Nav.Link href="#home" className="mx-2">
              My Library
            </Nav.Link>
            <Nav.Link href="#features" className="mx-2">
              My Outliners
            </Nav.Link>
            <Nav.Link href="#pricing" className="mx-2">
              My Groups
            </Nav.Link>
            <Nav.Link href="#home" className="mx-2">
              AI Tools
            </Nav.Link>
          </Nav>
          <Nav className="ms-auto">
            <NavDropdown
              title={
                <>
                  <img
                    src="https://via.placeholder.com/30"
                    alt="User"
                    className="rounded-circle"
                    style={{ marginRight: "8px" }}
                  />
                  {userName || "Loading..."}{" "}
                  {/* Show loading text until username is fetched */}
                </>
              }
              id="user-profile-dropdown"
            >
              <NavDropdown.Item href="/user">Settings</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="/">Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MainNavbar;
