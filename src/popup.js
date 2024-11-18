import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

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

// Debug element references
console.log({
    loginForm,
    loggedInDiv,
    saveBookmarkButton,
    logoutButton,
    loginButton,
    registerButton,
    emailInput,
    passwordInput
});

// Check Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginForm.style.display = 'none';
        loggedInDiv.style.display = 'block';
        loggedInDiv.setAttribute('aria-hidden', 'false');
        loginForm.setAttribute('aria-hidden', 'true');
    } else {
        loginForm.style.display = 'block';
        loggedInDiv.style.display = 'none';
        loggedInDiv.setAttribute('aria-hidden', 'true');
        loginForm.setAttribute('aria-hidden', 'false');
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
    console.log('Save Bookmark button clicked');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            alert('No active tab detected.');
            return;
        }

        // Validate URL format
        const url = tab.url;
        const encodedUrl = encodeURI(url);
        const urlPattern = new RegExp("^(https?:\\/\\/)?([\\w.-]+)+(\\/[\\w- ./?%&=]*)?$");
        if (!urlPattern.test(encodedUrl)) {
            alert("Invalid URL format.");
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            alert('You need to log in to save a bookmark.');
            return;
        }

        // Check for duplicates
        const linksRef = collection(db, "users", user.uid, "links");
        const querySnapshot = await getDocs(linksRef);
        const urls = querySnapshot.docs.map(doc => doc.data().url);

        if (urls.includes(encodedUrl)) {
            alert("This URL has already been saved.");
            return;
        }

        // Save bookmark
        const timestamp = new Date();
        await addDoc(linksRef, {
            url: encodedUrl,
            title: tab.title || "Untitled", // Use the tab's title if available
            timestamp
        });

        alert("Bookmark saved successfully.");
    } catch (error) {
        console.error('Failed to save bookmark:', error);
        alert(`Error saving bookmark: ${error.message}`);
    }
});

