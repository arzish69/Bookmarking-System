import React from "react";
import "./home.css";
import NavBar from "./navbar";
import Footer from "./footer";
import images from "../images/bookmark_banner.jpg";

function Home() {
  return (
    <>
      <NavBar />
      <div className="home_banner-container">
        <img src={images} alt="" />
      </div>
      <div className="home-section"></div>
      <div className="home-section gray"></div>
      <div className="home-section"></div>
      <div className="home-section gray"></div>
      <div className="home-section"></div>
      <div className="home-section gray"></div>
      <Footer />
    </>
  );
}

export default Home;
