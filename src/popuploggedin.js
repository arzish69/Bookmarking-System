import { collection, addDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from './firebaseConfig';

// Elements
const saveBookmarkButton = document.getElementById('save-bookmark');
const logoutButton = document.getElementById('logout');

// Logout
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        alert('Logged out successfully!');
        window.close();
    
        // Manually update the popup
    } catch (error) {
        alert(`Logout failed: ${error.message}`);
    }
});

// Save Bookmark
saveBookmarkButton.addEventListener('click', async () => {
  console.log('Save Bookmark button clicked');
  try {
    // Check if the user is authenticated
    const user = auth.currentUser;
    if (!user) {
      alert('You need to log in to save a bookmark.');
      return;
    }

    // Proceed with saving the bookmark if the user is authenticated
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      alert('No active tab detected.');
      return;
    }

    const { url, title } = tab;

    // Save the bookmark to Firestore
    await addDoc(collection(db, 'bookmarks'), { url, title, timestamp: new Date() });
    alert('Bookmark saved successfully!');
  } catch (error) {
    console.error('Error saving bookmark:', error);
    alert(`Failed to save bookmark: ${error.message}`);
  }
});
