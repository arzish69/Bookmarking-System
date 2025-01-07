// content-script.js
// Only run on webapp pages
if (window.location.origin === 'http://localhost:5173') {
  // Listen for successful login
  const checkForLogin = setInterval(() => {
    const user = localStorage.getItem('firebase:authUser:bookmarking-system:web');
    if (user) {
      clearInterval(checkForLogin);
      // Get stored return tab ID
      chrome.storage.local.get('returnToTabId', (data) => {
        if (data.returnToTabId) {
          // Clear stored tab ID
          chrome.storage.local.remove('returnToTabId');
          // Close current tab and return to original
          chrome.tabs.update(data.returnToTabId, { active: true });
          window.close();
        }
      });
    }
  }, 1000);
}

// Listen for auth state from webpage
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.source === 'webapp' && event.data.type === 'AUTH_STATE_CHANGED') {
    // Forward webapp auth state to background script
    chrome.runtime.sendMessage({
      type: 'AUTH_STATE_CHANGED',
      payload: event.data.payload
    });
  }
});