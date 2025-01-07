// content-script.js
let port;

try {
  port = chrome.runtime.connect({ name: 'auth-sync-' + Date.now() });
} catch (error) {
  console.log('Failed to establish port connection:', error);
}

// Only run on webapp pages
if (window.location.origin === 'http://localhost:5173') {
  // Listen for successful login
  const checkForLogin = setInterval(() => {
    try {
      const user = localStorage.getItem('firebase:authUser:bookmarking-system:web');
      if (user) {
        clearInterval(checkForLogin);
        // Get stored return tab ID
        chrome.storage.local.get('returnToTabId', (data) => {
          if (data.returnToTabId) {
            // Clear stored tab ID
            chrome.storage.local.remove('returnToTabId');
            try {
              // Close current tab and return to original
              chrome.tabs.update(data.returnToTabId, { active: true }, () => {
                if (chrome.runtime.lastError) {
                  console.log('Error updating tab:', chrome.runtime.lastError);
                  return;
                }
                window.close();
              });
            } catch (error) {
              console.log('Error handling tab update:', error);
            }
          }
        });
      }
    } catch (error) {
      clearInterval(checkForLogin);
      console.log('Error checking login:', error);
    }
  }, 1000);
}

// Listen for auth state from webpage
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.source === 'webapp' && event.data.type === 'AUTH_STATE_CHANGED') {
    try {
      // Try to send message through port first
      if (port) {
        port.postMessage({
          type: 'AUTH_STATE_CHANGED',
          payload: event.data.payload
        });
      }
      
      // Fallback to runtime message
      chrome.runtime.sendMessage({
        type: 'AUTH_STATE_CHANGED',
        payload: event.data.payload
      }).catch(() => {}); // Ignore any errors
    } catch (error) {
      console.log('Error forwarding auth state:', error);
    }
  }
});