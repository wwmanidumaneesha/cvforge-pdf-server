// server/server.js — serve frontend + generate PDFs (Render-friendly)
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Allow JSON bodies (big HTML payloads)
app.use(express.json({ limit: "8mb" }));

// CORS (handy during local dev; harmless on Render)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Serve static frontend from /public
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// Health check
app.get("/healthz", (_, res) => res.status(200).send("ok"));

// PDF endpoint (vector text, respects @page size)
app.post("/pdf", async (req, res) => {
  try {
    const { html, size = "A4", filename = "CVForge.pdf" } = req.body || {};
    if (!html || typeof html !== "string") {
      return res.status(400).send("Missing html");
    }

    // Launch headless Chrome provided by @sparticuz/chromium
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(), // Render/serverless path
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: size,                  // "A4" or "Letter"
      printBackground: true,
      preferCSSPageSize: true,       // respects @page from your template
      margin: { top: "14mm", right: "14mm", bottom: "14mm", left: "14mm" },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${String(filename).replace(/[^a-z0-9._-]/gi, "_")}"`
    );
    res.send(pdf);
  } catch (err) {
    console.error("PDF render error:", err);
    res.status(500).send("PDF render error");
  }
});

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`CVForge server running on http://localhost:${PORT}`);
});
