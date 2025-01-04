chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.authState) {
    const newAuthState = changes.authState.newValue;

    // Dynamically set the popup based on auth state
    if (newAuthState && newAuthState.user) {
      console.log("User is logged in:", newAuthState.user);
      chrome.action.setPopup({ popup: "loggedin.html" });
    } else {
      console.log("User is logged out");
      chrome.action.setPopup({ popup: "login.html" });
    }
  }
});

// Set the initial popup state on extension load
chrome.storage.local.get("authState", (result) => {
  const authState = result.authState;

  if (authState && authState.user) {
    chrome.action.setPopup({ popup: "loggedin.html" });
  } else {
    chrome.action.setPopup({ popup: "login.html" });
  }
});
