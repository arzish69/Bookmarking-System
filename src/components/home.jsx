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
      <div className="home-section">
        <h1 className="right-text">Lauda te Lassun</h1>
      </div>
      <div className="home-section gray">
        <h1 className="left-text"> Lauda te Lassun</h1>
      </div>
      <div className="home-section">
        <h1 className="right-text">Lauda te Lassun</h1>
      </div>
      <div className="home-section gray">
        <h1 className="left-text"> Lauda te Lassun</h1>
      </div>
      <div className="home-section">
        <h1 className="right-text">Lauda te Lassun</h1>
      </div>
      <div className="home-section gray">
        <h1 className="left-text"> Lauda te Lassun</h1>
      </div>
      <Footer />
    </>
  );
}

export default Home;
