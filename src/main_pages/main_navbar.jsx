// src/Navbar.js
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap"; // Import necessary components from react-bootstrap
import { Link } from "react-router-dom";

const MainNavbar = () => {
  const userName = "John Doe"; // Example user name

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
              My outliners
            </Nav.Link>
            <Nav.Link href="#pricing" className="mx-2">
              My groups
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
                  {userName}
                </>
              }
              id="user-profile-dropdown"
            >
              <NavDropdown.Item href="#profile">Profile</NavDropdown.Item>
              <NavDropdown.Item href="#settings">Settings</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/home">Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MainNavbar;
