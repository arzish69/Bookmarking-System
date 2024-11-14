import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as cheerio from "cheerio";

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/proxy", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new", // Make sure to use headless mode
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
    );

    // Wait for the page to load completely
    await page.goto(url, { waitUntil: "load" });

    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    $("script, style, nav, footer, header, aside, link, meta").remove();

    const content = [];
    const uniqueContent = new Set(); 

    // Loop through direct children of body only
    $("body").children().each((_, element) => {
      const tag = $(element).prop("tagName").toLowerCase();

      if (tag === "img") {
        const src = $(element).attr("src");
        if (src) {
          const absoluteSrc = new URL(src, url).href;
          if (!uniqueContent.has(absoluteSrc)) {
            content.push({ type: "image", src: absoluteSrc });
            uniqueContent.add(absoluteSrc);
          }
        }
      } else if (tag === "p" || tag === "div" || tag === "br") {
        const htmlContent = $(element).html();
        if (htmlContent && !uniqueContent.has(htmlContent)) {
          content.push({ type: "text", html: htmlContent });
          uniqueContent.add(htmlContent);
        }
      }
    });

    res.json({ content });
  } catch (error) {
    console.error("Error in proxying request:", error.message);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

app.use(express.static("build"));
app.get("*", (req, res) => {
  res.sendFile("index.html", { root: "build" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
