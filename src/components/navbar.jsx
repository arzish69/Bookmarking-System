import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap";
import { auth, db } from "../firebaseConfig";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import BellIcon from "../assets/bell.svg";
import Notify from "./notify";
import LogoutButton from "./LogoutButton";
import userIcon from "../assets/user-circle-1-svgrepo-com.svg";
import "./navbar.css";

const MainNavbar = () => {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNotificationBox, setShowNotificationBox] = useState(false);
  const [hasPendingInvitations, setHasPendingInvitations] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const db = getFirestore();

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
      setHasPendingInvitations(invitations.length > 0);
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserName = async (userId) => {
      try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserName(userDoc.data().username);
        } else {
          console.log("No such user document!");
          setUserName("Anonymous");
        }
      } catch (error) {
        console.error("Error fetching username:", error);
        setUserName("Error");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserName(user.uid);
        fetchPendingInvitations(user.uid);
      } else {
        setUserName("Guest");
        setCurrentUser(null);
        setLoading(false);
        setPendingInvitations([]);
        setHasPendingInvitations(false);
      }
    });

    return () => unsubscribe();
  }, [db]);

  const handleNotificationToggle = () => {
    setShowNotificationBox(!showNotificationBox);
  };

  return (
    <>
      <Navbar bg="light" expand="lg" fixed="top">
        <Container>
          <Navbar.Brand href={currentUser ? "/mainhome" : "/home"}>
            BookmarkHub
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            {currentUser ? (
              // Authenticated View
              <>
                <Nav className="mx-auto">
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
                  <button
                    className="btn"
                    onClick={handleNotificationToggle}
                    style={{ border: "none", background: "transparent", padding: 0, marginRight: "10px", position: "relative" }}
                  >
                    <img
                      src={BellIcon}
                      alt="Notifications"
                      style={{ width: "24px", height: "24px" }}
                    />
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

                  <NavDropdown
                    title={
                      <>
                        <img
                          src={userIcon}
                          alt="User"
                          className="rounded-circle"
                          style={{ marginRight: "8px" }}
                        />
                        {loading ? "Loading..." : userName}
                      </>
                    }
                    id="user-profile-dropdown"
                  >
                    {currentUser && (
                      <NavDropdown.Item href={`/user/${currentUser.uid}`}>
                        Settings
                      </NavDropdown.Item>
                    )}
                    <NavDropdown.Divider />
                    <LogoutButton />
                  </NavDropdown>
                </Nav>
              </>
            ) : (
              // Non-authenticated View
              <Nav className="ms-auto">
                <Nav.Link href="/downloads" className="mx-2">
                  Downloads
                </Nav.Link>
                <Nav.Link href="/signup" className="nav-button nav-box">
                  Get Started
                </Nav.Link>
              </Nav>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default MainNavbar;