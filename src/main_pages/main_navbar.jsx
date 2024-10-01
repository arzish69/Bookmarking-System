import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap";
import { auth, db } from "../firebaseConfig";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import BellIcon from "../assets/bell.svg"; // Import your bell icon
import Notify from "../components/notify"; // Import Link for client-side navigation

const MainNavbar = () => {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNotificationBox, setShowNotificationBox] = useState(false);
  const [hasPendingInvitations, setHasPendingInvitations] = useState(false); // Track if there are pending invitations
  const [pendingInvitations, setPendingInvitations] = useState([]); // Store the pending invitations
  const [currentUser, setCurrentUser] = useState(null); // Store the current authenticated user

  const db = getFirestore();

  // Function to fetch pending invitations for the current user
  const fetchPendingInvitations = async (userId) => {
    setLoading(true);
    try {
      const invitationsRef = collection(db, "users", userId, "pendingInvitations");
      const pendingQuery = query(invitationsRef, where("status", "==", "pending"));
      const querySnapshot = await getDocs(pendingQuery);

      const invitations = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPendingInvitations(invitations);

      // Notify the component state if there are any pending invitations
      setHasPendingInvitations(invitations.length > 0);
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the username and pending invitations when user logs in
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
        setCurrentUser(user);
        fetchUserName(user.uid);
        fetchPendingInvitations(user.uid); // Fetch invitations when user is authenticated immediately on login
      } else {
        setUserName("Guest"); // Set as guest if no user is authenticated
        setCurrentUser(null);
        setLoading(false); // Stop loading
        setPendingInvitations([]); // Clear pending invitations
        setHasPendingInvitations(false); // Reset state
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
                    top: "70px",
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
                  <Notify 
                    currentUser={currentUser} 
                    setHasPendingInvitations={setHasPendingInvitations} 
                    pendingInvitations={pendingInvitations} 
                    setPendingInvitations={setPendingInvitations} 
                  />
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
                {/* Ensure currentUser is available before using currentUser.uid */}
                {currentUser && (
                  <NavDropdown.Item href={`/user/${currentUser.uid}`}>
                    Settings
                  </NavDropdown.Item>
                )}
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
