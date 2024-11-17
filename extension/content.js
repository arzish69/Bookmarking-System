// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "HIGHLIGHT_TEXT") {
      highlightSelectedText();
    } else if (message.type === "CREATE_STICKY_NOTE") {
      createStickyNote();
    }
    sendResponse({ success: true });
  });
  
  // Highlight selected text and send it to the background script
  function highlightSelectedText() {
    const selection = window.getSelection();
    const text = selection.toString();
    if (text) {
      const span = document.createElement("span");
      span.style.backgroundColor = "yellow";
      span.textContent = text;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(span);
  
      // Send the annotation data to the background script
      chrome.runtime.sendMessage({
        type: "SAVE_ANNOTATION",
        data: { text, url: window.location.href, timestamp: new Date() },
      });
    }
  }
  
  // Create a sticky note on the page
  function createStickyNote() {
    const note = document.createElement("div");
    note.contentEditable = true;
    note.style.position = "absolute";
    note.style.backgroundColor = "yellow";
    note.style.border = "1px solid black";
    note.style.padding = "10px";
    note.style.zIndex = 1000;
    note.style.top = "100px";
    note.style.left = "100px";
    note.textContent = "New Note";
    document.body.appendChild(note);
  
    // Save sticky note details
    note.addEventListener("blur", () => {
      chrome.runtime.sendMessage({
        type: "SAVE_STICKY_NOTE",
        data: {
          content: note.textContent,
          position: { top: note.style.top, left: note.style.left },
          url: window.location.href,
          timestamp: new Date(),
        },
      });
    });
  }
  