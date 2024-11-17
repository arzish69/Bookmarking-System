import { db, auth } from "./firebaseConfig"; // Import your Firebase configuration
import { addDoc, collection } from "firebase/firestore";

// Listen for messages from content or popup scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    if (message.type === "SAVE_ANNOTATION") {
      await saveAnnotation(message.data);
      sendResponse({ success: true });
    } else if (message.type === "SAVE_STICKY_NOTE") {
      await saveStickyNote(message.data);
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error("Error handling message in background.js:", error);
    sendResponse({ success: false, error: error.message });
  }
});

// Save annotation to Firestore
async function saveAnnotation(data) {
  const { text, url, timestamp } = data;
  const annotationsCollection = collection(db, "annotations");
  await addDoc(annotationsCollection, {
    text,
    url,
    timestamp,
    userId: auth.currentUser?.uid || "anonymous",
  });
  console.log("Annotation saved successfully:", data);
}

// Save sticky note to Firestore
async function saveStickyNote(data) {
  const { content, position, url, timestamp } = data;
  const stickyNotesCollection = collection(db, "sticky_notes");
  await addDoc(stickyNotesCollection, {
    content,
    position,
    url,
    timestamp,
    userId: auth.currentUser?.uid || "anonymous",
  });
  console.log("Sticky note saved successfully:", data);
}
