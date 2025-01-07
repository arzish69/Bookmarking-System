// React Webapp Component
import { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const EXTENSION_ID = 'egobkfhpphmiakoggbiofoclldkiellf'; // Get this from Chrome extension page

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
        type: 'WEBAPP_AUTH_STATE',
        payload: authState
      }, '*');
    });
    
    // Listen for auth state changes from extension
    window.addEventListener('message', (event) => {
      if (event.data.type === 'EXTENSION_AUTH_STATE') {
        // Update your webapp state here
        // You might want to use Redux, Context, or other state management
        console.log('Auth state from extension:', event.data.payload);
      }
    });
    
    // Get initial auth state from extension
    chrome.runtime.sendMessage(EXTENSION_ID, { type: 'GET_AUTH_STATE' }, 
      (response) => {
        if (response) {
          console.log('Initial auth state:', response);
          // Update your webapp state here
        }
      }
    );
    
    return () => unsubscribe();
  }, []);
  
  return null; // This is a non-visual component
}

export default AuthSync;