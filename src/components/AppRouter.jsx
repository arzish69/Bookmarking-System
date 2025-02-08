import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Recommendation from '../main_pages/interests_selection/interest.jsx';
import OTP from '../main_pages/otp/OTPVerification.jsx';

import Home from '../main_pages/landing/landing.jsx';
import Downloads from '../main_pages/downloads.jsx';
import Library from '../main_pages/library.jsx';
import SignUp from '../main_pages/auth/signup.jsx';
import UserAccount from '../components/UserAccount/UserAccount.jsx';
import Groups from '../main_pages/group/group.jsx';
import Ai from '../main_pages/ai/ai.jsx';
import MainHome from '../main_pages/mainhome/mainhome.jsx';
import MainGroup from '../main_pages/maingroup/maingroup.jsx';
import GroupSettings from '../main_pages/group/grpsettings.jsx';
import ReaderView from '../main_pages/readerview/ReaderView.jsx';
import './AppRouter.css';

const AppRouter = () => {
  const { user, loading } = useAuth(); // Use authentication context

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loadsly"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/downloads" element={<Downloads />} />
        <Route path="/verify-otp" element={<OTP />} />

        {/* Protected Routes */}
        <Route
          path="/mainhome"
          element={user ? <MainHome /> : <Navigate to="/signup" />}
        />
        <Route
          path="/maingroup"
          element={user ? <MainGroup /> : <Navigate to="/signup" />}
        />
        <Route
          path="/library"
          element={user ? <Library /> : <Navigate to="/signup" />}
        />
        <Route
          path="/groups/:groupId"
          element={user ? <Groups /> : <Navigate to="/signup" />}
        />
        <Route
          path="/groups/:groupId/settings"
          element={user ? <GroupSettings /> : <Navigate to="/signup" />}
        />
        <Route
          path="/ai"
          element={user ? <Ai /> : <Navigate to="/signup" />}
        />
        <Route
          path="/user/:userId"
          element={user ? <UserAccount /> : <Navigate to="/signup" />}
        />
        <Route
          path="/read/:urlId"
          element={user ? <ReaderView /> : <Navigate to="/signup" />}
        />
        <Route
          path="/interests"
          element={user ? <Recommendation /> : <Navigate to="/signup" />}
        />

        {/* Public Routes */}
        <Route path="/signup" element={user ? <Navigate to="/library" /> : <SignUp />} />

        {/* Fallback Route */}
        <Route path="*" element={<div>Page not found!</div>} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
