// ats.js — simple ATS-friendly checks and hints
window.ATS = {
  check(data){
    const issues = [];
    // Common ATS hints (no images, tables, or columns -> we already avoid)
    if ((data.summary || '').length > 600) issues.push('Summary is quite long. Aim for ~3-5 concise lines.');
    if (!data.skills || data.skills.length === 0) issues.push('Add 6–12 skills relevant to the job description.');
    if (!data.experience || data.experience.length === 0) issues.push('Add at least one role in Experience.');
    // Bullet points should start with verbs and have outcomes
    if (data.experience) {
      const bullets = data.experience.flatMap(e => (e.achievements||'').split('\n'));
      const hasOutcome = bullets.some(b => /(\d|percent|%|reduced|increased|saved|grew|improved)/i.test(b));
      if (!hasOutcome) issues.push('Use outcome-based bullets (metrics, % change, savings).');
    }
    // Contact
    if (data.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) issues.push('Email looks invalid.');
    return issues;
  }
};