// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const loggedOutView = document.getElementById('loggedOutView');
  const loggedInView = document.getElementById('loggedInView');
  const userEmail = document.getElementById('userEmail');
  const loginButton = document.getElementById('loginButton');
  
  // Handle login button click
  loginButton.addEventListener('click', () => {
    // Open webapp signup page in new tab
    chrome.tabs.create({ url: 'http://localhost:5173/signup' }, (tab) => {
      // Store the original tab ID to return to it later
      chrome.storage.local.set({ 
        returnToTabId: tab.openerTabId 
      });
    });
  });
  
  // Check auth state when popup opens
  chrome.storage.local.get('authState', (data) => {
    updateUIForAuthState(data.authState);
  });
  
  // Listen for auth state changes
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'AUTH_STATE_CHANGED') {
      updateUIForAuthState(message.payload);
    }
  });
  
  function updateUIForAuthState(authState) {
    if (authState?.isAuthenticated) {
      loggedOutView.style.display = 'none';
      loggedInView.style.display = 'block';
      userEmail.textContent = `Signed in as ${authState.email}`;
    } else {
      loggedOutView.style.display = 'block';
      loggedInView.style.display = 'none';
    }
  }
});