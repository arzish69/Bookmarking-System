import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio"; // Import cheerio

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS middleware to handle CORS issues
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Define an API route for proxying requests to bypass CORS issues and extract text content
app.get("/proxy", async (req, res) => {
  const { url } = req.query; // Get URL to proxy from query parameters

  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    // Fetch the content of the target URL using Axios
    const response = await axios.get(url);
    const html = response.data;

    // Use Cheerio to extract text content from HTML
    const $ = cheerio.load(html);
    const bodyContent = $("body").html(); // Get body content as HTML

    // Return the extracted HTML content to the client as a JSON object
    res.json({ content: bodyContent });
  } catch (error) {
    console.error("Error in proxying request:", error.message);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// Serve static files from the build folder if needed (for production)
app.use(express.static("build"));

// Default route to serve index.html for React Router compatibility
app.get("*", (req, res) => {
  res.sendFile("index.html", { root: "build" });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
