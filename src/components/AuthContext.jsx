// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    // Listen for auth state changes in webapp
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Notify extension of auth state change
      const authState = currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        isAuthenticated: true
      } : { isAuthenticated: false };

      window.postMessage({
        source: 'webapp',
        type: 'AUTH_STATE_CHANGED',
        payload: authState
      }, '*');
    });

    // Listen for auth state changes from extension
    const extensionListener = (event) => {
      if (event.source !== window) return;
      if (event.data.source === 'extension' && 
          event.data.type === 'AUTH_STATE_CHANGED') {
        const extensionAuthState = event.data.payload;
        
        // If extension logs out, log out webapp
        if (!extensionAuthState.isAuthenticated && user) {
          signOut(auth).catch(console.error);
        }
      }
    };

    window.addEventListener('message', extensionListener);

    return () => {
      unsubscribe();
      window.removeEventListener('message', extensionListener);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};