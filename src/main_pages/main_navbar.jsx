import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap"; 
import { auth } from "../firebaseConfig"; 
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import BellIcon from "../assets/bell.svg"; // Import your bell icon
import Notify from "../components/notify";

const MainNavbar = () => {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNotificationBox, setShowNotificationBox] = useState(false);
  const [hasPendingInvitations, setHasPendingInvitations] = useState(false); // Track if there are pending invitations
  const [currentUser, setCurrentUser] = useState(null); // Store the current authenticated user
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

  // Function to toggle the notification box visibility
  const handleNotificationToggle = () => {
    setShowNotificationBox(!showNotificationBox);
  };

  return (
    <>
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
              <Nav.Link href="/maingroup" className="mx-2">
                My Groups
              </Nav.Link>
              <Nav.Link href="/ai" className="mx-2">
                Summarizer
              </Nav.Link>
            </Nav>
            <Nav className="ms-auto d-flex align-items-center position-relative">
              {/* Bell Icon Button */}
              <button
                className="btn"
                onClick={handleNotificationToggle} // Toggle notification box
                style={{ border: "none", background: "transparent", padding: 0, marginRight: "10px", position: "relative" }}
              >
                <img
                  src={BellIcon}
                  alt="Notifications"
                  style={{ width: "24px", height: "24px" }}
                />
                {/* Show red dot if there are pending invitations */}
                {hasPendingInvitations && (
                  <span
                    style={{
                      position: "absolute",
                      top: "18px",
                      right: "-3px",
                      width: "10px",
                      height: "10px",
                      backgroundColor: "red",
                      borderRadius: "50%",
                      display: "inline-block",
                      boxShadow: "0 0 5px rgba(0,0,0,0.5)"
                    }}
                  ></span>
                )}
              </button>

              {/* Notification Box */}
              {showNotificationBox && (
                <div
                  className="notification-box"
                  style={{
                    position: "absolute",
                    top: "70px", // Adjust positioning to be just below the bell icon
                    right: "0",
                    width: "300px",
                    maxHeight: "400px",
                    backgroundColor: "white",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    borderRadius: "8px",
                    zIndex: 1000,
                    overflowY: "auto",
                    padding: "10px",
                  }}
                >
                  {/* Call Notify Component Here */}
                  <Notify currentUser={currentUser} setHasPendingInvitations={setHasPendingInvitations} />
                </div>
              )}

              {/* User Profile with Username */}
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


    </>
  );
};

export default MainNavbar;
