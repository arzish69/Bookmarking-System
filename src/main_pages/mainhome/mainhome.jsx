import React from "react";
import "./mainhome.css";
import MainNavbar from "../main_navbar";

const articles = [
  {
    id: 1,
    title: "International Artist Feature: Malaysia",
    author: "Mary Winkler",
    image: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/210284/flex-1.jpg",
    url: "https://design.tutsplus.com/articles/international-artist-feature-malaysia--cms-26852",
  },
  {
    id: 2,
    title: "How to Conduct Remote Usability Testing",
    author: "Harry Brignull",
    image: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/210284/users-2.png",
    url: "https://webdesign.tutsplus.com/articles/how-to-conduct-remote-usability-testing--cms-27045",
  },
  {
    id: 3,
    title: "Created by You, July Edition",
    author: "Melody Nieves",
    image: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/210284/flex-5.jpg",
    url: "https://design.tutsplus.com/articles/envato-tuts-community-challenge-created-by-you-july-edition--cms-26724",
    description:
      "Welcome to our monthly feature of fantastic tutorial results created by you, the Envato Tuts+ community!",
  },
  {
    id: 4,
    title: "How to Code a Scrolling “Alien Lander” Website",
    author: "Kezz Bracey",
    image: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/210284/landing.png",
    url: "https://webdesign.tutsplus.com/tutorials/how-to-code-a-scrolling-alien-lander-website--cms-26826",
    description:
      "We’ll be putting things together so that as you scroll down from the top of the page you’ll see an “Alien Lander” making its way to touch down.",
  },
  {
    id: 5,
    title: "How to Create a “Stranger Things” Text Effect in Adobe Photoshop",
    author: "Rose",
    image: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/210284/strange.jpg",
    url: "https://design.tutsplus.com/tutorials/stranger-things-inspired-text-effect--cms-27139",
  },
  {
    id: 6,
    title: "5 Inspirational Business Portraits and How to Make Your Own",
    author: "Marie Gardiner",
    image: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/210284/flor.jpg",
    url: "https://photography.tutsplus.com/articles/5-inspirational-business-portraits-and-how-to-make-your-own--cms-27338",
  },
  {
    id: 7,
    title: "Notes From Behind the Firewall: The State of Web Design in China",
    author: "Kendra Schaefer",
    image: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/210284/china.png",
    url: "https://webdesign.tutsplus.com/articles/notes-from-behind-the-firewall-the-state-of-web-design-in-china--cms-22281",
  },
];

const MainHome = () => {
    return (
        <>
        <MainNavbar />
        <header>
        <h1>Cool Articles</h1>
      </header>
      <div className="band">
        {articles.map((article) => (
          <div key={article.id} className={`item-${article.id}`}>
            <a href={article.url} className="card" target="_blank" rel="noopener noreferrer">
              <div
                className="thumb"
                style={{ backgroundImage: `url(${article.image})` }}
              ></div>
              <article>
                <h1>{article.title}</h1>
                {article.description && <p>{article.description}</p>}
                <span>{article.author}</span>
              </article>
            </a>
          </div>
        ))}
      </div>
        </>
    )
};

export default MainHome;