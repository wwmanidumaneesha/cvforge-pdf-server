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

// JSON body (large payloads OK)
app.use(express.json({ limit: "12mb" }));

// CORS (optional; fine to keep)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Static frontend
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// Health
app.get("/healthz", (_, res) => res.status(200).send("ok"));

// PDF endpoint (vector text)
app.post("/pdf", async (req, res) => {
  try {
    const { html, size = "A4", filename = "CVForge.pdf" } = req.body || {};
    if (!html || typeof html !== "string") {
      return res.status(400).send("Missing html");
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(), // Render/serverless chrome
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.emulateMediaType("screen");
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: size,                 // "A4" or "Letter"
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "14mm", right: "14mm", bottom: "14mm", left: "14mm" },
    });

    await browser.close();

    // Important: send raw buffer with correct headers
    const safeName = String(filename).replace(/[^a-z0-9._-]/gi, "_");
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Length", String(pdfBuffer.length));
    res.end(pdfBuffer);
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
