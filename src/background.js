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

// background.js
// Track connections
const connections = {};

// Handle connection establishment
chrome.runtime.onConnect.addListener((port) => {
  const portId = port.name;
  connections[portId] = port;
  
  port.onDisconnect.addListener(() => {
    delete connections[portId];
  });
});

// Broadcast auth state to all connections
const broadcastAuthState = (authState) => {
  chrome.storage.local.set({ authState }, () => {
    chrome.runtime.sendMessage({
      type: 'AUTH_STATE_CHANGED',
      payload: authState
    });
  });
};

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_STATE_CHANGED') {
    broadcastAuthState(message.payload);
  }
  return true;
});