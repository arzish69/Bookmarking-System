let ws = new WebSocket("ws://localhost:3000");

ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    if (data.state === "loggedOut") {
      console.log("User logged out");
      chrome.storage.local.set({ authState: { user: null, state: "loggedOut" } }, () => {
        console.log("Auth state cleared in Chrome storage.");
        chrome.action.setPopup({ popup: "login.html" });
      });
    } else if (data.state === "loggedIn") {
      console.log("User logged in:", data.user);
      chrome.storage.local.set({ authState: data }, () => {
        console.log("Auth state updated in Chrome storage.");
        chrome.action.setPopup({ popup: "loggedin.html" });
      });
    } else {
      console.warn("Unexpected data state:", data);
    }
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
  }
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

let retryCount = 0;
const maxRetries = 10;

ws.onclose = () => {
  console.log("WebSocket connection closed. Retrying in 5 seconds...");
  if (retryCount < maxRetries) {
    retryCount++;
    setTimeout(() => {
      console.log("Attempting to reconnect...");
      ws = new WebSocket("ws://localhost:3000");
    }, 5000); // Retry every 5 seconds
  } else {
    console.error("Maximum retry attempts reached. Stopping reconnection attempts.");
  }
};
