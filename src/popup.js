import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const loginForm = document.getElementById('login-form');
const loggedInDiv = document.getElementById('logged-in');
const saveBookmarkButton = document.getElementById('save-bookmark');
const logoutButton = document.getElementById('logout');
const loginButton = document.getElementById('login');
const registerButton = document.getElementById('register');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Check Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginForm.style.display = 'none';
        loggedInDiv.style.display = 'block';
    } else {
        loginForm.style.display = 'block';
        loggedInDiv.style.display = 'none';
    }
});

// Login
loginButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Logged in successfully!');
    } catch (error) {
        alert(`Login failed: ${error.message}`);
    }
});

// Register
registerButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Registered successfully!');
    } catch (error) {
        alert(`Registration failed: ${error.message}`);
    }
});

// Logout
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        alert('Logged out successfully!');
    } catch (error) {
        alert(`Logout failed: ${error.message}`);
    }
});

// Save Bookmark
saveBookmarkButton.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        const url = tab.url;
        try {
            await addDoc(collection(db, 'bookmarks'), {
                url,
                userId: auth.currentUser.uid,
                createdAt: new Date()
            });
            alert('Bookmark saved!');
        } catch (error) {
            alert(`Failed to save bookmark: ${error.message}`);
        }
    }
});
