import React from "react";
import "./home.css";
import NavBar from "./navbar";
import Footer from "./footer";
import images from "../images/v915-wit-002-k.jpg";

function Home() {
  return (
    <>
      <NavBar />
      <div className="home_banner-container">
        <img src={images} alt="" />
        <div className="text-overlay">Making learning easy.</div>
        <button type="button" className="btn btn-dark">
          Install Extension
        </button>
      </div>
      <div className="home-section">
        <h1 className="right-text">Collect</h1>
      </div>
      <div className="home-section gray">
        <h1 className="left-text">Annotate</h1>
      </div>
      <div className="home-section">
        <h1 className="right-text">Organize</h1>
      </div>
      <div className="home-section gray">
        <h1 className="left-text">Summarize</h1>
      </div>
      <div className="home-section">
        <h1 className="right-text">Share</h1>
      </div>
      <div className="home-section gray">
        <h1 className="left-text">Discuss</h1>
      </div>
      <Footer />
    </>
  );
}

export default Home;
