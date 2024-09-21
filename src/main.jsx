import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import Home from "./components/home.jsx";
import Downloads from "./components/downloads.jsx";
import Library from "./main_pages/library.jsx";
import SignUp from "./components/signup.jsx";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import UserAccount from "./components/user/user.jsx";
import Groups from "./main_pages/group/group.jsx";
import Ai from "./main_pages/ai/ai.jsx";
import MainHome from "./main_pages/mainhome/mainhome.jsx";
import MainGroup from "./main_pages/maingroup/maingroup.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div>
        <Home />
      </div>
    ),
  },
  {
    path: "home",
    element: (
      <div>
        <Home />
      </div>
    ),
  },
  {
    path: "downloads",
    element: (
      <div>
        <Downloads />
      </div>
    ),
  },
  {
    path: "mainhome",
    element: (
      <div>
        <MainHome />
      </div>
    ),
  },
  {
    path: "maingroup",
    element: (
      <div>
        <MainGroup />
      </div>
    ),
  },
  {
    path: "library",
    element: (
      <div>
        <Library />
      </div>
    ),
  },
  {
    path: "groups/:groupId",  // Dynamic route for individual group pages
    element: (
      <div>
        <Groups />
      </div>
    ),
  },
  {
    path: "ai",
    element: (
      <div>
        <Ai />
      </div>
    ),
  },
  {
    path: "signup",
    element: (
      <div>
        <SignUp />
      </div>
    ),
  },
  {
    path: "user",
    element: (
      <div>
        <UserAccount />
      </div>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
