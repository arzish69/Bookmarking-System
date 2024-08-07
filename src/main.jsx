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
    path: "library",
    element: (
      <div>
        <Library />
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
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
