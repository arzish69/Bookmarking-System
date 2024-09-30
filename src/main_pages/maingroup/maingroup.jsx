import React, { useEffect, useState } from "react";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { auth, db } from "../firebaseConfig"; // Import Firebase configuration
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import BellIcon from "../assets/bell.svg"; // Your bell icon
import Notify from "../components/notify";

const MainNavbar = () => {
  const [userName, setUserName] = useState(""); // Store username
  const [loading, setLoading] = useState(true); // Track loading state
  const [showNotificationBox, setShowNotificationBox] = useState(false); // Show/hide notification box
  const [currentUser, setCurrentUser] = useState(null); // Store authenticated user
  const [hasPendingInvitations, setHasPendingInvitations] = useState(false); // Track if there are pending invitations
  const [pendingInvitations, setPendingInvitations] = useState([]); // Track pending invitations

  // Fetch pending invitations for the current user
  const fetchPendingInvitations = async (userId) => {
    try {
      const invitationsRef = collection(db, "users", userId, "pendingInvitations");
      const pendingQuery = query(invitationsRef, where("status", "==", "pending"));
      const querySnapshot = await getDocs(pendingQuery);

      const invitations = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPendingInvitations(invitations);
      setHasPendingInvitations(invitations.length > 0);
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
    }
  };

  const handleAccept = async (invitation) => {
    try {
      setLoading(true);
      const groupRef = doc(db, "groups", invitation.groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(currentUser.uid),
      });

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        groups: arrayUnion(invitation.groupId),
      });

      await deleteDoc(doc(db, "users", currentUser.uid, "pendingInvitations", invitation.id));

      fetchPendingInvitations(currentUser.uid); // Refresh the pending invitations list
    } catch (error) {
      console.error("Error accepting invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (invitation) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, "users", currentUser.uid, "pendingInvitations", invitation.id));
      fetchPendingInvitations(currentUser.uid); // Refresh the pending invitations list
    } catch (error) {
      console.error("Error declining invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchPendingInvitations(user.uid); // Fetch pending invitations immediately on login
        setUserName(user.displayName || "User"); // Get the username from the user object
        setLoading(false);
      } else {
        setCurrentUser(null);
        setPendingInvitations([]);
        setHasPendingInvitations(false); // Reset state when no user is logged in
        setUserName("Guest");
      }
    });

    return () => unsubscribe();
  }, []);

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
              onClick={() => setShowNotificationBox(!showNotificationBox)}
              style={{ border: "none", background: "transparent", padding: 0, marginRight: "10px", position: "relative" }}
            >
              <img src={BellIcon} alt="Notifications" style={{ width: "24px", height: "24px" }} />
              {hasPendingInvitations && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    width: "10px",
                    height: "10px",
                    backgroundColor: "red",
                    borderRadius: "50%",
                    display: "inline-block",
                    boxShadow: "0 0 5px rgba(0,0,0,0.5)",
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
                  top: "40px",
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
                {/* Pass data to Notify */}
                <Notify
                  pendingInvitations={pendingInvitations} // Pass invitations directly to Notify
                  handleAccept={handleAccept}
                  handleDecline={handleDecline}
                  loading={loading}
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
