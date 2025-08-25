# CVForge — Modern CV Builder

A clean, powerful, ATS-friendly CV/Resume builder with live preview, multiple templates, autosave, sharing, and one‑click PDF export (via print CSS). Works offline (PWA).

## Highlights
- 🎨 **4 templates** (Minimal, Elegant, Bold, Compact) w/ color themes
- 🧠 **ATS-friendly guidance** (basic checks, no tables/images)
- 🧭 **Command palette** (Ctrl/⌘ K), Undo/Redo, keyboard shortcuts
- 💾 **Autosave** to localStorage + Import/Export JSON
- 🖨️ **PDF export** using print-optimized CSS (A4/Letter)
- 🔁 **Drag & drop** to reorder experience/education/projects
- 📤 **Share link** (state in URL hash)
- 📦 **PWA** offline support (install on desktop/mobile)

## Getting Started
Just open `index.html` in a modern browser. To enable PWA and offline, serve with any static server (or VS Code Live Server), then "Install" from the browser menu.

## Optional PHP Save Endpoint
Use `server/save.php` to store JSON on your server (add auth first!).

## Print to PDF
We use `@page { size: A4 | Letter; margin: 14mm }` and print media queries so `Ctrl/⌘ + P` exports a clean PDF.

## License
MIT
