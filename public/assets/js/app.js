// app.js — main controller for CVForge (fixed input binding)
(() => {
  const { $, $$, on, emit, pushHistory, undo, redo } = window.CVForge;
  const TPLS = window.CVForgeTemplates;

  const state = {
    template: 'minimal',
    theme: 'violet',
    page: 'A4',
    zoom: 1,
    data: {
      name: '', title: '', email: '', phone: '', location: '', website: '',
      summary: '',
      skills: [],
      experience: [], education: [], projects: [], customSections: []
    }
  };

  const el = {
    form: $('#cvForm'),
    templateSelect: $('#templateSelect'),
    themeSelect: $('#themeSelect'),
    toggleDark: $('#toggleDark'),
    paletteBtn: $('#commandPalette'),
    cmdDialog: $('#cmdDialog'),
    cmdInput: $('#cmdInput'),
    cmdResults: $('#cmdResults'),
    frame: $('#resumeFrame'),
    zoomIn: $('#zoomIn'),
    zoomOut: $('#zoomOut'),
    zoomValue: $('#zoomValue'),
    pageSize: $('#pageSize'),
    printPdf: $('#printPdf'),
    shareLink: $('#shareLink'),
    importJson: $('#importJson'),
    exportJson: $('#exportJson'),
    resetForm: $('#resetForm'),
    undoBtn: $('#undoBtn'),
    redoBtn: $('#redoBtn'),
    skillInput: $('#skillInput'),
    expList: $('#experienceList'),
    eduList: $('#educationList'),
    prjList: $('#projectList'),
    customList: $('#customSectionList'),
  };

  // ----- Persistence (localStorage)
  const KEY = 'cvforge-state-v1';
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const load = () => {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  };

  // ----- Initialize
  load();
  bindUI();
  renderForm();
  renderPreview();
  pushHistory(state);

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openPalette(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); doExportJSON(); }
    if (e.key.toLowerCase()==='d'){ toggleDark(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z'){ e.preventDefault(); applyState(undo()); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y'){ e.preventDefault(); applyState(redo()); }
  });

  function bindUI(){
    // Theme/template
    el.templateSelect.value = state.template;
    el.themeSelect.value = state.theme;
    el.templateSelect.addEventListener('change', () => { state.template = el.templateSelect.value; save(); renderPreview(); });
    el.themeSelect.addEventListener('change', () => { state.theme = el.themeSelect.value; document.documentElement.setAttribute('data-theme', state.theme); save(); renderPreview(); });
    document.documentElement.setAttribute('data-theme', state.theme);

    // Dark mode
    el.toggleDark.addEventListener('click', toggleDark);
    function toggleDark(){
      const dark = document.documentElement.classList.toggle('dark');
      el.toggleDark.setAttribute('aria-pressed', String(dark));
      save();
      renderPreview(); // preview matches
    }

    // Zoom & page
    el.zoomIn.addEventListener('click', () => setZoom(state.zoom + 0.1));
    el.zoomOut.addEventListener('click', () => setZoom(state.zoom - 0.1));
    el.pageSize.addEventListener('click', () => {
      state.page = state.page === 'A4' ? 'Letter' : 'A4';
      el.pageSize.textContent = state.page;
      save(); renderPreview();
    });
    el.printPdf.addEventListener('click', () => exportPDFServer());
    
    // Share
    el.shareLink.addEventListener('click', () => {
      const compact = btoa(unescape(encodeURIComponent(JSON.stringify(state.data))));
      const url = new URL(location.href);
      url.hash = 'd=' + compact + '&t=' + state.template + '&th=' + state.theme;
      navigator.clipboard.writeText(url.toString());
      alert('Sharable link copied to clipboard.');
    });

    // Import/export/reset
    el.exportJson.addEventListener('click', doExportJSON);
    el.importJson.addEventListener('click', async () => {
      const [fh] = await window.showOpenFilePicker?.({types:[{description:'JSON',accept:{'application/json':['.json']}}]}) || [];
      if (!fh) return;
      const file = await fh.getFile();
      const data = JSON.parse(await file.text());
      state.data = data;
      renderForm(); renderPreview(); pushHistory(state); save();
    });
    el.resetForm.addEventListener('click', () => {
      if (!confirm('Reset all fields?')) return;
      state.data = {name:'',title:'',email:'',phone:'',location:'',website:'',summary:'',skills:[],experience:[],education:[],projects:[],customSections:[]};
      renderForm(); renderPreview(); pushHistory(state); save();
    });

    // Undo/redo
    el.undoBtn.addEventListener('click', () => applyState(undo()));
    el.redoBtn.addEventListener('click', () => applyState(redo()));

    // Command palette
    el.paletteBtn.addEventListener('click', openPalette);
    el.cmdInput.addEventListener('input', refreshCmds);
    el.cmdResults.addEventListener('click', (e) => {
      const item = e.target.closest('[data-cmd]');
      if (item){ runCmd(item.dataset.cmd); el.cmdDialog.close(); }
    });

    // Skills chip input
    el.skillInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.currentTarget.value.trim()){
        const v = e.currentTarget.value.trim();
        state.data.skills.push(v);
        e.currentTarget.value = '';
        save(); renderForm(); renderPreview(); pushHistory(state);
      }
      if (e.key === 'Backspace' && !e.currentTarget.value && state.data.skills.length){
        state.data.skills.pop();
        save(); renderForm(); renderPreview(); pushHistory(state);
      }
    });
  }

  function applyState(s){
    if (!s) return;
    const fresh = JSON.parse(JSON.stringify(s));
    Object.assign(state, fresh);
    renderForm(); renderPreview(); save();
  }

  function setZoom(z){
    state.zoom = Math.max(.6, Math.min(2, z));
    el.zoomValue.textContent = Math.round(state.zoom*100) + '%';
    el.frame.style.transform = `scale(${state.zoom})`;
    el.frame.style.transformOrigin = 'top center';
  }
  setZoom(state.zoom);

  // ----- Form rendering
  function renderForm(){
    // Basic fields — FIX: persistent oninput (no {once:true})
    for (const k of ['name','title','email','phone','location','website','summary']){
      const input = el.form.querySelector(`[name="${k}"]`);
      if (!input) continue;
      input.value = state.data[k] || '';
      input.oninput = (e) => {
        state.data[k] = e.target.value;
        save(); renderPreview(); pushHistory(state);
      };
    }

    // Skills chips
    const chipWrap = $('.chip-input');
    chipWrap.querySelectorAll('.chip').forEach(c => c.remove());
    (state.data.skills||[]).forEach((s,i) => {
      const chip = document.createElement('span'); chip.className='chip'; chip.textContent=s;
      const btn = document.createElement('button'); btn.setAttribute('aria-label', 'Remove skill'); btn.textContent='×';
      btn.onclick = () => { state.data.skills.splice(i,1); save(); renderForm(); renderPreview(); pushHistory(state); };
      chip.appendChild(btn); chipWrap.insertBefore(chip, el.skillInput);
    });

    // Repeatable sections
    mountRepeatable(el.expList, state.data.experience, '#experienceItemTpl', ['company','role','start','end','achievements']);
    mountRepeatable(el.eduList, state.data.education, '#educationItemTpl', ['institution','qualification','start','end','highlights']);
    mountRepeatable(el.prjList, state.data.projects, '#projectItemTpl', ['name','link','description']);
    mountRepeatable(el.customList, state.data.customSections, '#customSectionTpl', ['title','icon','lines']);

    // Buttons to add
    $('#addExperience').onclick = () => { state.data.experience.push({}); save(); renderForm(); renderPreview(); pushHistory(state); };
    $('#addEducation').onclick = () => { state.data.education.push({}); save(); renderForm(); renderPreview(); pushHistory(state); };
    $('#addProject').onclick = () => { state.data.projects.push({}); save(); renderForm(); renderPreview(); pushHistory(state); };
    $('#addCustomSection').onclick = () => { state.data.customSections.push({}); save(); renderForm(); renderPreview(); pushHistory(state); };
  }

  function mountRepeatable(container, arr, tplSel, keys){
    container.innerHTML = '';
    const tpl = document.querySelector(tplSel);
    arr.forEach((item, idx) => {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const inputs = node.querySelectorAll('input,textarea');
      inputs.forEach((input,i) => {
        const k = keys[i];
        input.value = item[k] || '';
        input.addEventListener('input', (e) => { item[k] = e.target.value; save(); renderPreview(); pushHistory(state); });
      });
      node.addEventListener('dragstart', (e) => { node.classList.add('dragging'); e.dataTransfer.setData('text/plain', idx.toString()); });
      node.addEventListener('dragend', () => node.classList.remove('dragging'));
      node.querySelector('.remove').onclick = () => { arr.splice(idx,1); save(); renderForm(); renderPreview(); pushHistory(state); };
      container.appendChild(node);
    });
    container.ondragover = (e) => e.preventDefault();
    container.ondrop = (e) => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData('text/plain'));
      const rects = [...container.children].map(c => c.getBoundingClientRect());
      const y = e.clientY;
      const overIdx = rects.findIndex(r => y < r.top + r.height/2);
      const targetIdx = overIdx === -1 ? arr.length - 1 : overIdx;
      const [moved] = arr.splice(from,1);
      arr.splice(targetIdx,0,moved);
      save(); renderForm(); renderPreview(); pushHistory(state);
    };
  }

  // ----- Preview rendering (iframe)
  function renderPreview(){
    const doc = el.frame.contentDocument;
    const theme = themeConfig(state.theme);
    const { css, html } = TPLS[state.template](state.data, theme);
    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
      <meta charset='utf-8'><title>Preview</title>
      <style>${css}</style>
      <style>@page{size:${state.page}; margin: 14mm} @media print{ body{color:black} }</style>
      ${document.documentElement.classList.contains('dark') ? "<style>body{filter:contrast(1.05) brightness(.95)}</style>" : ""}
      </head><body>${html}</body></html>`);
    doc.close();

    const issues = window.ATS.check(state.data);
    el.frame.title = issues.length ? 'Issues: ' + issues.join(' | ') : 'CV preview OK';
  }

  function themeConfig(key){
    const map = {
      zinc: {accent:'#71717a'}, blue:{accent:'#2563eb'}, violet:{accent:'#7c3aed'},
      emerald:{accent:'#10b981'}, amber:{accent:'#f59e0b'}, rose:{accent:'#e11d48'}
    };
    return map[key] || map.violet;
  }

  // ----- Command palette
  const COMMANDS = [
    {id:'export', label:'Export JSON', run: () => doExportJSON()},
    {id:'pdf', label:'Export PDF (Print)', run: () => el.frame.contentWindow.print()},
    {id:'template-minimal', label:'Template: Minimal', run: () => setTemplate('minimal')},
    {id:'template-elegant', label:'Template: Elegant', run: () => setTemplate('elegant')},
    {id:'template-bold', label:'Template: Bold', run: () => setTemplate('bold')},
    {id:'template-compact', label:'Template: Compact', run: () => setTemplate('compact')},
    {id:'theme-blue', label:'Theme: Blue', run: () => setTheme('blue')},
    {id:'theme-emerald', label:'Theme: Emerald', run: () => setTheme('emerald')},
    {id:'theme-rose', label:'Theme: Rose', run: () => setTheme('rose')},
    {id:'reset', label:'Reset all fields', run: () => el.resetForm.click()},
    {id:'undo', label:'Undo', run: () => applyState(undo())},
    {id:'redo', label:'Redo', run: () => applyState(redo())},
  ];
  function openPalette(){ el.cmdDialog.showModal(); el.cmdInput.value=''; refreshCmds(); el.cmdInput.focus(); }
  function refreshCmds(){
    const q = el.cmdInput.value.toLowerCase();
    const out = COMMANDS.filter(c => c.label.toLowerCase().includes(q));
    el.cmdResults.innerHTML = out.map(c => `<div data-cmd="${c.id}" role="option">${c.label}</div>`).join('');
  }
  function runCmd(id){
    const cmd = COMMANDS.find(c => c.id === id);
    if (cmd) cmd.run();
  }
  function setTemplate(t){ state.template = t; el.templateSelect.value = t; save(); renderPreview(); }
  function setTheme(th){ state.theme = th; el.themeSelect.value = th; document.documentElement.setAttribute('data-theme', th); save(); renderPreview(); }


  // ----- Export PDF via Puppeteer (vector text, no cropping, one-click)
  async function exportPDFServer(){
    const theme = themeConfig(state.theme);
    const { css, html } = CVForgeTemplates[state.template](state.data, theme);
    const margin = 14;

    const cleanHTML = `
      <!doctype html><html><head><meta charset="utf-8">
      <style>${css}</style>
      <style>
        @page { size: ${state.page}; margin: ${margin}mm }
        html, body { background:#ffffff; color:#111827; margin:0; }
      </style>
      </head><body>${html}</body></html>`;

    const fn = `${(state.data.name || 'CV').trim()} - ${state.template}.pdf`;

    const resp = await fetch('/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: cleanHTML, size: state.page, filename: fn })
    });

    if (!resp.ok) { alert('PDF export failed.'); return; }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }


  // ----- Export JSON
  function doExportJSON(){
    const blob = new Blob([JSON.stringify(state.data, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cvforge-data.json';
    a.click();
  }


  // Load from URL hash (share link)
  if (location.hash.includes('d=')){
    try{
      const params = new URLSearchParams(location.hash.slice(1));
      const d = JSON.parse(decodeURIComponent(escape(atob(params.get('d')))));
      state.data = d;
      const t = params.get('t'); if (t) state.template = t;
      const th = params.get('th'); if (th) state.theme = th;
      renderForm(); renderPreview(); save();
    }catch(e){ console.warn('Failed to parse shared data', e); }
  }
})();
