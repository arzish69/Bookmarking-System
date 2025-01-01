import React from 'react';
import ReactDOM from 'react-dom/client'; // Corrected ReactDOM for newer versions
import AppRouter from './components/AppRouter.jsx'; // Adjust path as needed
import { AuthProvider } from './components/AuthContext.jsx'; // Import the AuthContext

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);

