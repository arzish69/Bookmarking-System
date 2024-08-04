// src/SideNav.js
import React, { useState } from "react";
import MainNavbar from "./main_navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import { Collapse } from "react-bootstrap"; // Make sure react-bootstrap is installed

const SideNav = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null); // Manage which dropdown is open

  const items = [
    { name: "Bookmarks", hasDropdown: false },
    {
      name: "Annotate PDFs",
      hasDropdown: true,
      subItems: ["Luxury", "Sport", "Casual"],
    },
    { name: "Organize", hasDropdown: false },
    {
      name: "AI Summarizer",
    },
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleDropdownToggle = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm)
  );

  return (
    <>
      <MainNavbar />
      <div className="side-nav" style={styles.sideNav}>
        <div className="filter-content" style={styles.filterContent}>
          <form className="pb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <div className="input-group-append">
                <button className="btn btn-light" type="button">
                  <i className="fa fa-search"></i>
                </button>
              </div>
            </div>
          </form>
          <ul className="list-menu" style={styles.listMenu}>
            {filteredItems.map((item, index) => (
              <li key={index} className="nav-item">
                {item.hasDropdown ? (
                  <>
                    <a
                      href="#"
                      className="nav-link"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDropdownToggle(index);
                      }}
                    >
                      {item.name}
                      <i
                        className={`fa ${
                          openDropdown === index
                            ? "fa-chevron-up"
                            : "fa-chevron-down"
                        }`}
                        style={styles.chevron}
                      ></i>
                    </a>
                    <Collapse in={openDropdown === index}>
                      <ul className="dropdown-menu" style={styles.dropdownMenu}>
                        {item.subItems.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <a href="#" className="dropdown-item">
                              {subItem}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </Collapse>
                  </>
                ) : (
                  <a href="#" className="nav-link">
                    {item.name}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

const styles = {
  sideNav: {
    width: "250px",
    height: "calc(100vh - 56px)", // Adjust based on your navbar height
    backgroundColor: "#f8f9fa",
    position: "fixed",
    top: "56px", // Adjust based on your navbar height
    left: "0",
    overflowY: "auto",
    transition: "transform 0.3s ease",
  },
  filterContent: {
    padding: "15px",
  },
  listMenu: {
    listStyleType: "none",
    padding: "0",
  },
  chevron: {
    marginLeft: "auto",
    transition: "transform 0.3s ease",
  },
  dropdownMenu: {
    listStyleType: "none",
    padding: "0",
    margin: "0",
    paddingLeft: "15px",
  },
};

export default SideNav;
