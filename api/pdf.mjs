// api/pdf.js — Vercel serverless function for vector PDFs
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export const config = { runtime: 'nodejs18.x' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const { html, size = 'A4', filename = 'CVForge.pdf' } = req.body || {};
  if (!html) return res.status(400).send('Missing html');

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: size,
      printBackground: true,
      margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' },
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename.replace(/[^a-z0-9._-]/gi, '_')}"`
    );
    res.send(pdf);
  } catch (e) {
    console.error(e);
    res.status(500).send('PDF render error');
  }
}
