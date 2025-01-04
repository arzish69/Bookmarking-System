document.addEventListener("DOMContentLoaded", () => {
  // Fetch the authentication state from Chrome storage
  chrome.storage.local.get("authState", (result) => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving auth state:", chrome.runtime.lastError);
      return;
    }

    const authState = result.authState;

    // Redirect based on authentication state
    if (authState && authState.user) {
      window.location.href = "loggedin.html";
    } else {
      window.location.href = "login.html";
    }
  });
});
