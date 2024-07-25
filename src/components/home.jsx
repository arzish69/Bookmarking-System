import React from "react";
import "./home.css";
import NavBar from "./navbar";
import images from "../images/bookmark_banner.jpg";

function Home() {
  return (
    <>
      <NavBar />
      <div className="home_banner-container">
        <img src={images} alt="" />
      </div>
    </>
  );
}

export default Home;
