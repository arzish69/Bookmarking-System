import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    setPersistence, 
    browserLocalPersistence, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

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

const appLink = document.querySelector('#app-link a');

// Ensure persistenc

setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('Auth persistence set to local.');

        // Dynamic link based on auth state
        const appLink = document.querySelector('#app-link a');
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('User is logged in:', user);
                appLink.href = "http://localhost:5173/mainhome";
                appLink.textContent = "Go to the Main Application";
            } else {
                console.log('No user logged in.');
                appLink.href = "http://localhost:5173/signup";
                appLink.textContent = "Sign Up to Start Using the Application";
            }
        });
    })
    .catch((error) => {
        console.error('Error setting auth persistence:', error);
    });


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
        console.log('Auth state changed: User logged in.');
        loginForm.style.display = 'none';
        loggedInDiv.style.display = 'block';
        loggedInDiv.setAttribute('aria-hidden', 'false');
        loginForm.setAttribute('aria-hidden', 'true');
    } else {
        console.log('Auth state changed: No user logged in.');
        loginForm.style.display = 'block';
        loggedInDiv.style.display = 'none';
        loggedInDiv.setAttribute('aria-hidden', 'true');
        loginForm.setAttribute('aria-hidden', 'false');
    }
});

// Login
loginButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Logged in successfully!');
    } catch (error) {
        alert(`Login failed: ${error.message}`);
    }
});

// Register
registerButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
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

        const url = tab.url.trim();
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
        const duplicateQuery = query(linksRef, where('url', '==', encodedUrl));
        const duplicateSnapshot = await getDocs(duplicateQuery);

        if (!duplicateSnapshot.empty) {
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
        if (error.code === 'permission-denied') {
            alert('You do not have permission to save this bookmark.');
        } else {
            console.error('Failed to save bookmark:', error);
            alert(`Error saving bookmark: ${error.message}`);
        }
    }
});
