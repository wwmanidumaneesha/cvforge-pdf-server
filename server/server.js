// server/server.js  — serve frontend + generate PDFs
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* CORS so you can also test from file:// during dev (harmless on Render) */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(bodyParser.json({ limit: "5mb" }));

/* Serve static frontend from /public (index.html, assets, etc.) */
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

/* Health check */
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

/* One-click vector PDF with selectable text */
app.post("/pdf", async (req, res) => {
  try {
    const { html, size = "A4", filename = "CVForge.pdf" } = req.body || {};
    if (!html || typeof html !== "string") {
      return res.status(400).send("Missing html");
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // required on most hosts
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const margin = "14mm";
    const pdf = await page.pdf({
      format: size,                 // "A4" or "Letter"
      printBackground: true,
      margin: { top: margin, right: margin, bottom: margin, left: margin },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/[^a-z0-9._-]/gi, "_")}"`
    );
    res.send(pdf);
  } catch (err) {
    console.error("PDF render error:", err);
    res.status(500).send("PDF render error");
  }
});

/* Single-page app fallback */
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`CVForge server running on http://localhost:${PORT}`)
);
