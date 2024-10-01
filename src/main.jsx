import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // If App is needed as a main layout
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import Home from "./components/home.jsx";
import Downloads from "./components/downloads.jsx";
import Library from "./main_pages/library.jsx";
import SignUp from "./components/signup.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import UserAccount from "./components/UserAccount/UserAccount.jsx";
import Groups from "./main_pages/group/group.jsx";
import Ai from "./main_pages/ai/ai.jsx";
import MainHome from "./main_pages/mainhome/mainhome.jsx";
import MainGroup from "./main_pages/maingroup/maingroup.jsx";
import GroupSettings from "./main_pages/group/grpsettings.jsx";

const router = createBrowserRouter([
  {
    path: "/", // Home page route
    element: <Home />,
  },
  {
    path: "home", // Explicit "home" route
    element: <Home />,
  },
  {
    path: "downloads", // Downloads page
    element: <Downloads />,
  },
  {
    path: "mainhome", // Main Home page
    element: <MainHome />,
  },
  {
    path: "maingroup", // Main Group page
    element: <MainGroup />,
  },
  {
    path: "library", // Library page
    element: <Library />,
  },
  {
    path: "groups/:groupId", // Dynamic group page route
    element: <Groups />,
  },
  {
    path: "groups/:groupId/settings", // Dynamic group settings page route
    element: <GroupSettings />,
  },
  {
    path: "ai", // AI page
    element: <Ai />,
  },
  {
    path: "signup", // Sign-up page
    element: <SignUp />,
  },
  {
    path: "user/:userId", // Dynamic route for user profile page
    element: <UserAccount />, // Render UserAccount component based on userId
  },
]);

// Render the router
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
