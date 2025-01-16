// popup.js
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Initialize Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  const loggedOutView = document.getElementById('loggedOutView');
  const loggedInView = document.getElementById('loggedInView');
  const userEmail = document.getElementById('userEmail');
  const loginButton = document.getElementById('loginButton');
  const saveBookmarkButton = document.getElementById('saveBookmarkButton');
  const bookmarkForm = document.getElementById('bookmarkForm');
  const bookmarkTitle = document.getElementById('bookmarkTitle');
  const bookmarkTags = document.getElementById('bookmarkTags');
  const confirmSaveButton = document.getElementById('confirmSaveButton');
  const cancelButton = document.getElementById('cancelButton');
  
  // Handle login button click
  loginButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/signup' }, (tab) => {
      chrome.storage.local.set({ 
        returnToTabId: tab.openerTabId 
      });
    });
  });
  
  // Save bookmark button click
  saveBookmarkButton.addEventListener('click', async () => {
    // Get current tab URL and title
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    bookmarkTitle.value = tab.title || '';
    
    // Show bookmark form
    saveBookmarkButton.style.display = 'none';
    bookmarkForm.style.display = 'block';
  });

  // Cancel button click
  cancelButton.addEventListener('click', () => {
    resetBookmarkForm();
  });

  // Confirm save button click
  confirmSaveButton.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get auth state from storage
    chrome.storage.local.get('authState', async (data) => {
      const authState = data.authState;
      console.log('Current authState:', authState); // Debug log

      if (!authState?.isAuthenticated || !authState?.uid) {
        console.error('No authenticated user found');
        alert('Please ensure you are logged in');
        return;
      }

      // Create tags array from space-separated input
      const timestamp = new Date();
      const tagsArray = bookmarkTags.value.split(" ").filter((tag) => tag.trim() !== "");

      // Create bookmark document
      const bookmark = {
        url: tab.url,
        title: bookmarkTitle.value,
        tags: tagsArray,
        timestamp,
      };

      try {
        // Save to Firestore using stored auth UID
        const userLinksRef = collection(db, `users/${authState.uid}/links`);
        console.log('Saving bookmark for user:', authState.uid); // Debug log
        await addDoc(userLinksRef, bookmark);
        
        // Reset form
        resetBookmarkForm();
        
        // Show success message
        alert('Bookmark saved successfully!');
      } catch (error) {
        console.error('Error saving bookmark:', error);
        console.error('Error details:', error.code, error.message);
        alert('Failed to save bookmark. Please try again.');
      }
    });
  });

  function resetBookmarkForm() {
    bookmarkForm.style.display = 'none';
    saveBookmarkButton.style.display = 'block';
    bookmarkTitle.value = '';
    bookmarkTags.value = '';
  }
  
  // Check auth state when popup opens
  chrome.storage.local.get('authState', (data) => {
    console.log('Initial authState:', data.authState);
    updateUIForAuthState(data.authState);
  });
  
  // Listen for auth state changes
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'AUTH_STATE_CHANGED') {
      console.log('Auth state changed:', message.payload);
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