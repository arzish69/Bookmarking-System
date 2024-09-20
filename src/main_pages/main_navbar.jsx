// src/Navbar.js
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap"; 
import { auth } from "../firebaseConfig"; 
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const MainNavbar = () => {
  const [userName, setUserName] = useState(""); 
  const [loading, setLoading] = useState(true); // Add loading state
  const db = getFirestore();

  useEffect(() => {
    const fetchUserName = async (userId) => {
      try {
        const userDocRef = doc(db, "users", userId); 
        const userDoc = await getDoc(userDocRef); 

        if (userDoc.exists()) {
          setUserName(userDoc.data().username);
        } else {
          console.log("No such user document!");
          setUserName("Anonymous"); // Handle missing username
        }
      } catch (error) {
        console.error("Error fetching username:", error);
        setUserName("Error");
      } finally {
        setLoading(false); // Ensure loading stops
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserName(user.uid);
      } else {
        setUserName("Guest"); // Set as guest if no user is authenticated
        setLoading(false); // Stop loading
      }
    });

    return () => unsubscribe(); // Cleanup the subscription on unmount
  }, [db]);

  return (
    <Navbar bg="light" expand="lg" fixed="top">
      <Container>
        <Navbar.Brand href="#home">Clone</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="mx-auto">
            <Nav.Link href="/mainhome" className="mx-2">
              Home
            </Nav.Link>
            <Nav.Link href="/library" className="mx-2">
              My Library
            </Nav.Link>
            <Nav.Link href="/groups" className="mx-2">
              My Groups
            </Nav.Link>
            <Nav.Link href="/ai" className="mx-2">
              Summarizer
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
                  {loading ? "Loading..." : userName} 
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
