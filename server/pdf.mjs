import express from "express";
import bodyParser from "body-parser";
import puppeteer from "puppeteer";

const app = express();

// --- CORS + preflight so you can call from file:// or any port
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// accept up to ~5MB resume HTML
app.use(bodyParser.json({ limit: "5mb" }));

app.post("/pdf", async (req, res) => {
  try {
    const { html, size = "A4", filename = "CVForge.pdf" } = req.body || {};
    if (!html) return res.status(400).send("Missing html");

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const margin = "14mm";
    const pdf = await page.pdf({
      format: size,
      printBackground: true,
      margin: { top: margin, right: margin, bottom: margin, left: margin }
    });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/[^a-z0-9._-]/gi, "_")}"`
    );
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF render error");
  }
});

app.listen(8081, () => console.log("PDF server on http://localhost:8081"));
