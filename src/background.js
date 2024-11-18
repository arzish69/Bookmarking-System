import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "SAVE_BOOKMARK") {
    const { url, title } = message.data;
    try {
      await addDoc(collection(db, "bookmarks"), { url, title, timestamp: new Date() });
      sendResponse({ success: true });
    } catch (error) {
      console.error("Error saving bookmark:", error);
      sendResponse({ success: false, error: error.message });
    }
  }
});
