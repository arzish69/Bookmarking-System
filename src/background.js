// background.js
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, initializeAuth, indexedDBLocalPersistence, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence
});

// Track connections
const connections = new Set();

// Handle connection establishment
chrome.runtime.onConnect.addListener((port) => {
  connections.add(port);
  
  port.onDisconnect.addListener(() => {
    connections.delete(port);
  });
});

// Broadcast auth state to all connections
const broadcastAuthState = (authState) => {
  chrome.storage.local.set({ authState }, () => {
    // Safely send message to all active connections
    connections.forEach(port => {
      try {
        port.postMessage({
          type: 'AUTH_STATE_CHANGED',
          payload: authState
        });
      } catch (error) {
        console.log('Error sending message to port:', error);
        connections.delete(port);
      }
    });
    
    // Also try runtime message for popup
    try {
      chrome.runtime.sendMessage({
        type: 'AUTH_STATE_CHANGED',
        payload: authState
      }).catch(() => {}); // Ignore errors here
    } catch (error) {
      console.log('Error broadcasting message:', error);
    }
  });
};

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_STATE_CHANGED') {
    broadcastAuthState(message.payload);
  }
  if (message.type === 'GET_AUTH_STATE') {
    chrome.storage.local.get('authState', (data) => {
      try {
        sendResponse(data.authState);
      } catch (error) {
        console.log('Error sending response:', error);
      }
    });
    return true;
  }
});