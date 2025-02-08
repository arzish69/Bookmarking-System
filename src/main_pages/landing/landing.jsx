import React from "react";
import "./landing.css";
import MainNavbar from "../../components/navbar";
import Footer from "../../components/footer";
import images from "../../images/v915-wit-002-k.jpg";

function Home() {
  return (
    <>
      <MainNavbar />
      <div className="home_banner-container">
        <img src={images} alt="" />
        <div className="text-overlay">Making learning easy.</div>
        <button type="button" className="btn btn-dark">
          Install Extension
        </button>
      </div>
      <div className="home-section">
        <h1 className="right-text">Collect</h1>
        <p className="right-text">
          Save and tag your online resources for easy access anytime, anywhere
        </p>
      </div>
      <div className="home-section gray">
        <h1 className="left-text">Annotate</h1>
        <p className="left-text">
          Annotate web pages and PDFs directly as you browse online
        </p>
      </div>
      <div className="home-section">
        <h1 className="right-text">Organize</h1>
        <p className="right-text">
          Organize your links, references and personal input to create a
          <br></br>
          structured research base through Outliner
        </p>
      </div>
      <div className="home-section gray">
        <h1 className="left-text">Summarize</h1>
        <p className="left-text">
          Generate concise summaries of lengthy articles and documents with just
          one click
        </p>
      </div>
      <div className="home-section">
        <h1 className="right-text">Share</h1>
        <p className="right-text">
          Share your research with friends, classmates, colleagues or associates
        </p>
      </div>
      <div className="home-section gray">
        <h1 className="left-text">Discuss</h1>
        <p className="left-text">
          Engage in conversations directly within the content, enhancing the
          <br></br>
          learning and research experience
        </p>
      </div>
      <Footer />
    </>
  );
}

export default Home;
