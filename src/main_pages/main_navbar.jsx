import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, NavDropdown, Container, Modal, Button } from "react-bootstrap"; 
import { auth } from "../firebaseConfig"; 
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import BellIcon from "../assets/bell.svg"; // Import your bell icon

const MainNavbar = () => {
  const [userName, setUserName] = useState(""); 
  const [loading, setLoading] = useState(true); // Add loading state
  const [showNotificationModal, setShowNotificationModal] = useState(false); // State to control modal
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

  // Function to handle modal show/hide
  const handleModalToggle = () => {
    setShowNotificationModal(!showNotificationModal);
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
            <Nav className="ms-auto d-flex align-items-center">
              {/* Bell Icon Button */}
              <button
                className="btn"
                onClick={handleModalToggle} // Open modal when clicked
                style={{ border: "none", background: "transparent", padding: 0, marginRight: "10px" }}
              >
                <img
                  src={BellIcon}
                  alt="Notifications"
                  style={{ width: "24px", height: "24px" }}
                />
              </button>

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

      {/* Notification Modal */}
      <Modal
        show={showNotificationModal}
        onHide={handleModalToggle}
        centered
        size="lg" // You can customize the size as needed
        style={{ maxHeight: "80vh" }} // Ensure it doesn't take too much vertical space
      >
        <Modal.Header closeButton>
          <Modal.Title>Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: "400px", overflowY: "auto" }}> {/* Adjust the height */}
          <p>This is a tall rectangular notification window!</p>
          <p>Here you can list all your notifications or any other content you'd like.</p>
          <p>More notifications can be added here. This can scroll if the content exceeds the height.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalToggle}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MainNavbar;
