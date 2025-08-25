// templates.js — multiple ATS-friendly templates using CSS variables
window.CVForgeTemplates = {
  baseCSS: (theme) => `
    :root{
      --accent:${theme.accent};
      --text:#111827;
      --muted:#4b5563;
      --rule:#e5e7eb;
      --chip:#eef2ff;
      --h:#0f172a;
      font-family: ${theme.font || 'Inter, system-ui, Segoe UI, Roboto, Arial'};
    }
    *{box-sizing:border-box}
    body{margin:0;padding:32px;background:white;color:var(--text)}
    h1,h2,h3{margin:0 0 8px 0;color:var(--h)}
    h1{font-size:28px;letter-spacing:.2px}
    h2{font-size:14px;text-transform:uppercase;color:var(--muted);letter-spacing:.8px}
    h3{font-size:13px}
    p,li{font-size:12px;line-height:1.5;margin:0 0 8px 0}
    ul{padding-left:18px;margin:0}
    .muted{color:var(--muted)}
    .rule{height:2px;background:var(--rule);margin:14px 0}
    .chip{display:inline-block;padding:4px 8px;border-radius:999px;background:var(--chip);margin:0 6px 6px 0;font-size:11px}
    .grid{display:grid;gap:12px;grid-template-columns: 3fr 2fr}
    .sec{margin:12px 0}
    .row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .tag{color:white;background:var(--accent);padding:2px 6px;border-radius:6px;font-size:10px}
    .time{color:var(--muted);font-size:11px}
    .col{display:flex;flex-direction:column;gap:10px}
    .bullet{list-style: disc}
    .mb8{margin-bottom:8px}
    .mb4{margin-bottom:4px}
    .contact a{color:inherit;text-decoration:none}
    .icon{font-size:14px}
    /* Page breaks */
    .page-break{page-break-before: always; break-before: page}
  `,

  minimal: (data, theme) => {
    const css = CVForgeTemplates.baseCSS(theme) + `
      .name{display:flex;justify-content:space-between;align-items:flex-start}
      .name h1{font-weight:800}
      .name .title{color:var(--accent);font-weight:600}
    `;
    return { css, html: `
      <section class="name">
        <div>
          <h1>${data.name || ""}</h1>
          <div class="title">${data.title || ""}</div>
        </div>
        <div class="contact">
          <div>${data.location || ""}</div>
          <div><a>${data.email || ""}</a> ${data.phone ? "• " + data.phone : ""}</div>
          ${data.website ? `<div><a>${data.website}</a></div>` : ""}
        </div>
      </section>
      ${data.summary ? `<div class="sec"><p>${data.summary}</p></div>` : ""}
      <div class="rule"></div>
      <div class="grid">
        <div class="col">
          ${section("Experience", data.experience?.map(exp => `
            <div class="mb8">
              <div class="row"><strong>${exp.role||""}</strong><span class="muted">— ${exp.company||""}</span></div>
              <div class="time">${fmtRange(exp.start, exp.end)}</div>
              ${bullets(exp.achievements)}
            </div>
          `).join("") || "")}
          ${section("Projects", data.projects?.map(p => `
            <div class="mb8">
              <div class="row"><strong>${p.name||""}</strong>${p.link ? `<span class="tag">link</span>`:""}</div>
              <p>${p.description||""}</p>
            </div>
          `).join("") || "")}
        </div>
        <div class="col">
          ${section("Skills", data.skills?.map(s => `<span class="chip">${s}</span>`).join(" ") || "")}
          ${section("Education", data.education?.map(ed => `
            <div class="mb8">
              <div class="row"><strong>${ed.qualification||""}</strong><span class="muted">— ${ed.institution||""}</span></div>
              <div class="time">${fmtRange(ed.start, ed.end)}</div>
              ${bullets(ed.highlights)}
            </div>
          `).join("") || "")}
          ${customSections(data.customSections)}
        </div>
      </div>
    `};
  },

  elegant: (data, theme) => {
    const css = CVForgeTemplates.baseCSS(theme) + `
      header.hero{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--rule);padding-bottom:12px}
      header.hero .left{max-width:70%}
      header.hero .name{font-size:30px}
      .badge{background:var(--accent);color:#fff;padding:4px 8px;border-radius:6px;font-weight:600}
    `;
    return { css, html: `
      <header class="hero">
        <div class="left">
          <div class="name"><strong>${data.name||""}</strong></div>
          <div class="muted">${data.title||""}</div>
          ${data.summary ? `<p class="mb8">${data.summary}</p>`:""}
        </div>
        <div class="right contact">
          <div>${data.location||""}</div>
          <div>${data.email||""} ${data.phone? "• "+data.phone: ""}</div>
          ${data.website? `<div>${data.website}</div>`:""}
        </div>
      </header>

      ${section("Skills", data.skills?.map(s => `<span class="chip">${s}</span>`).join(" ") || "")}
      ${section("Experience", data.experience?.map(exp => `
        <div class="mb8">
          <div class="row"><span class="badge">${fmtRange(exp.start, exp.end)}</span><strong>${exp.role||""}</strong><span class="muted">— ${exp.company||""}</span></div>
          ${bullets(exp.achievements)}
        </div>
      `).join("") || "")}
      <div class="grid">
        <div class="col">
          ${section("Projects", data.projects?.map(p => `
            <div class="mb8"><strong>${p.name||""}</strong>${p.link? ` — <span class="muted">${p.link}</span>`:""}<p>${p.description||""}</p></div>
          `).join("") || "")}
        </div>
        <div class="col">
          ${section("Education", data.education?.map(ed => `
            <div class="mb8"><strong>${ed.qualification||""}</strong><div class="muted">${ed.institution||""}</div><div class="time">${fmtRange(ed.start, ed.end)}</div>${bullets(ed.highlights)}</div>
          `).join("") || "")}
          ${customSections(data.customSections)}
        </div>
      </div>
    `};
  },

  bold: (data, theme) => {
    const css = CVForgeTemplates.baseCSS(theme) + `
      .name{font-size:32px;font-weight:900;color:var(--h)}
      .banner{background:var(--accent);color:white;padding:8px 12px;border-radius:8px;margin:8px 0;display:inline-block}
      h2{color:var(--accent)}
    `;
    return { css, html: `
      <div class="name">${data.name||""}</div>
      <div class="muted">${data.title||""}</div>
      <div class="row contact muted"><div>${data.email||""}</div><div>${data.phone||""}</div><div>${data.location||""}</div>${data.website?`<div>${data.website}</div>`:""}</div>
      ${data.summary ? `<p class="banner">${data.summary}</p>`:""}
      ${section("Experience", data.experience?.map(exp => `
        <div class="mb8">
          <div class="row"><strong>${exp.company||""}</strong><span>${exp.role||""}</span><span class="time">${fmtRange(exp.start, exp.end)}</span></div>
          ${bullets(exp.achievements)}
        </div>`).join("") || "")}
      <div class="grid">
        <div>${section("Skills", data.skills?.map(s => `<span class="chip">${s}</span>`).join(" ") || "")}</div>
        <div>${section("Education", data.education?.map(ed => `
          <div class="mb8"><strong>${ed.institution||""}</strong><div>${ed.qualification||""}</div><div class="time">${fmtRange(ed.start, ed.end)}</div></div>
        `).join("") || "")}</div>
      </div>
      ${section("Projects", data.projects?.map(p => `<div class="mb8"><strong>${p.name||""}</strong> — ${p.description||""} ${p.link?`<span class="muted">(${p.link})</span>`:""}</div>`).join("") || "")}
      ${customSections(data.customSections)}
    `};
  },

  compact: (data, theme) => {
    const css = CVForgeTemplates.baseCSS(theme) + `
      body{padding:24px}
      .grid{grid-template-columns: 1fr 1fr}
      p,li{font-size:11px}
    `;
    return { css, html: `
      <h1>${data.name||""}</h1>
      <div class="row muted"><div>${data.title||""}</div><div>${data.email||""}</div><div>${data.phone||""}</div><div>${data.location||""}</div></div>
      ${section("Summary", data.summary || "")}
      ${section("Skills", data.skills?.map(s => `<span class="chip">${s}</span>`).join(" ") || "")}
      <div class="grid">
        <div>
          ${section("Experience", data.experience?.map(exp => `
            <div class="mb4"><strong>${exp.role||""}</strong> — ${exp.company||""} <span class="time">${fmtRange(exp.start, exp.end)}</span>${bullets(exp.achievements)}</div>
          `).join("") || "")}
        </div>
        <div>
          ${section("Education", data.education?.map(ed => `
            <div class="mb4"><strong>${ed.qualification||""}</strong> — ${ed.institution||""} <span class="time">${fmtRange(ed.start, ed.end)}</span>${bullets(ed.highlights)}</div>
          `).join("") || "")}
          ${customSections(data.customSections)}
        </div>
      </div>
    `};
  }
};

function section(title, body){
  if(!body || (typeof body === "string" && body.trim()==="")) return "";
  return `<section class="sec"><h2>${title}</h2>${body}</section>`;
}
function bullets(text){
  if(!text) return "";
  const items = String(text).split(/\n+/).filter(Boolean).map(s => `<li>${escapeHtml(s)}</li>`).join("");
  return items ? `<ul class="bullet">${items}</ul>` : "";
}
function customSections(sections){
  if(!sections || !sections.length) return "";
  return sections.map(sec => `
    <section class="sec">
      <h2>${sec.title || ""}</h2>
      ${sec.lines ? `<ul class="bullet">${sec.lines.split(/\n+/).filter(Boolean).map(l=>`<li>${escapeHtml(l)}</li>`).join("")}</ul>` : ""}
    </section>
  `).join("");
}
function fmtRange(a,b){
  return [a||"", b||""].filter(Boolean).join(" — ");
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
