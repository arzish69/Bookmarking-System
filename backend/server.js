const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const admin = require("firebase-admin");
const http = require("http");
const WebSocket = require("ws");

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Sync Auth State (When user logs in or logs out)
app.post("/sync-auth-state", async (req, res) => {
  console.log("Received sync-auth-state request:", req.body);
  const { user, state } = req.body;

  if (state === "loggedIn" && user) {
    console.log(`User ${user.uid} logged in`);
    broadcastToChromeExtensions({ user, state });
  } else if (state === "loggedOut") {
    console.log("User logged out");
    broadcastToChromeExtensions({ user: null, state });
  }

  res.status(200).json({ success: true });
});

// Start Express and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients
const connectedClients = new Set();

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("Chrome extension connected");
  connectedClients.add(ws);

  // Listener for WebSocket error (optional, for debugging)
  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });

  // Prevent auto-removal of client on close unless the server is shutting down
  ws.on("close", (code, reason) => {
    console.log(`WebSocket closed: code=${code}, reason=${reason}`);
    // Optional: Keep the client in the set if the closure is not server-triggered
    if (!serverClosing) {
      console.log("Ignoring WebSocket close as server is running");
    } else {
      connectedClients.delete(ws);
    }
  });
});

// Flag to track server state
let serverClosing = false;

// Graceful shutdown logic
const shutdownServer = () => {
  serverClosing = true;
  console.log("Shutting down server...");

  // Close all WebSocket connections gracefully
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1001, "Server shutting down"); // Use 1001 (Going Away) close code
    }
  });

  // Stop the server
  server.close(() => {
    console.log("Server shut down complete.");
    process.exit(0);
  });
};

// Handle server termination signals (e.g., CTRL+C)
process.on("SIGINT", shutdownServer);
process.on("SIGTERM", shutdownServer);

// Broadcast function for WebSocket clients
const broadcastToChromeExtensions = (message) => {
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

// Start server
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
