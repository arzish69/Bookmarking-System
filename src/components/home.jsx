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
        <p>Save and tag your online resources for easy access anytime, anywhere</p>
      </div>
      <div className="home-section gray">
        <h1 className="left-text">Annotate</h1>
        <p>Annotate web pages and PDFs directly as you browse online </p>
      </div>
      <div className="home-section">
        <h1 className="right-text">Organize</h1>
        <p>Organize your links, references and personal input to create a structured research base through Outliner</p>
      </div>
      <div className="home-section gray">
        <h1 className="left-text">Summarize</h1>
        <p>Generate concise summaries of lengthy articles and documents with just one click
        </p>
      </div>
      <div className="home-section">
        <h1 className="right-text">Share</h1>
        <p>Share your research with friends, classmates, colleagues or associates</p>
      </div>
      <div className="home-section gray">
        <h1 className="left-text">Discuss</h1>
        <p>Engage in conversations directly within the content, enhancing the learning and research experience</p>
      </div>
      <Footer />
    </>
  );
}

export default Home;
