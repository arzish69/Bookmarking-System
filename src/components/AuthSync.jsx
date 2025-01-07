// AuthSync.jsx
import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const EXTENSION_ID = 'egobkfhpphmiakoggbiofoclldkiellf';

function AuthSync() {
  useEffect(() => {
    const auth = getAuth();
    
    // Listen for auth state changes in webapp
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const authState = user ? {
        uid: user.uid,
        email: user.email,
        isAuthenticated: true
      } : { isAuthenticated: false };
      
      // Notify extension
      window.postMessage({
        source: 'webapp',
        type: 'AUTH_STATE_CHANGED',
        payload: authState
      }, '*');
      
      // Also try direct message to extension
      try {
        chrome.runtime.sendMessage(EXTENSION_ID, {
          type: 'AUTH_STATE_CHANGED',
          payload: authState
        }).catch(() => {}); // Ignore any errors
      } catch (error) {
        // Extension might not be available, ignore
      }
    });
    
    // Listen for auth state changes from extension
    const extensionListener = (event) => {
      if (event.data.type === 'EXTENSION_AUTH_STATE') {
        console.log('Auth state from extension:', event.data.payload);
      }
    };
    
    window.addEventListener('message', extensionListener);
    
    return () => {
      unsubscribe();
      window.removeEventListener('message', extensionListener);
    };
  }, []);
  
  return null;
}

export default AuthSync;