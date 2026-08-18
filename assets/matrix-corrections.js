/* Correction-matrix accessibility and interaction repairs. */
(function () {
  'use strict';
  const section = document.querySelector('[data-section-id]');
  if (!section) return;

  function hideUnneededInputs() {
    if (!section.dataset.matrixNoInput) return;
    const pageContent = document.querySelector('#content') || section;
    const removeGeneratedControls = () => {
      pageContent.querySelectorAll('.adt-open-response').forEach(el => (el.closest('label') || el).remove());
      pageContent.querySelectorAll('input, textarea, select, button, .adt-activity-actions, .adt-match-panel').forEach(el => el.remove());
    };
    removeGeneratedControls();
    // The reader can append answer controls after this file has loaded. Keep
    // reading-only pages free of those controls even after late initialization.
    new MutationObserver(removeGeneratedControls).observe(pageContent, { childList: true, subtree: true });
  }

  function tracingTool() {
    if (!section.dataset.matrixTracing || section.querySelector('.matrix-tracing-tool')) return;
    section.querySelectorAll('input, .adt-activity-actions').forEach(el => el.remove());
    const tool = document.createElement('div'); tool.className = 'matrix-tracing-tool';
    tool.innerHTML = '<h2>Trace the numbers</h2><p>Use a finger, stylus, or mouse to trace each number. You may clear and try again.</p>';
    for (let n = 1; n <= 9; n++) {
      const label = document.createElement('label'); label.className = 'matrix-trace-card';
      label.innerHTML = '<span>Trace ' + n + '</span><canvas width="320" height="120" aria-label="Tracing area for number ' + n + '"></canvas><button type="button">Clear ' + n + '</button><textarea aria-label="Text alternative for number ' + n + '" placeholder="Or type the number ' + n + '"></textarea>';
      const canvas = label.querySelector('canvas'), ctx = canvas.getContext('2d');
      ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = '#2563eb';
      let active = false, last;
      const point = e => { const r = canvas.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; return {x:(p.clientX-r.left)*canvas.width/r.width,y:(p.clientY-r.top)*canvas.height/r.height}; };
      canvas.addEventListener('pointerdown', e => { active = true; last = point(e); canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointermove', e => { if (!active) return; const p = point(e); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p; });
      canvas.addEventListener('pointerup', () => { active=false; });
      label.querySelector('button').addEventListener('click', () => ctx.clearRect(0,0,canvas.width,canvas.height));
      tool.appendChild(label);
    }
    section.appendChild(tool);
  }

  function manualAudio() {
    if (!section.dataset.matrixManualAudio) return;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'matrix-audio-button'; button.textContent = 'Play page audio';
    button.addEventListener('click', () => {
      const first = document.querySelector('audio');
      if (first) { first.paused ? first.play() : first.pause(); button.textContent = first.paused ? 'Play page audio' : 'Pause page audio'; }
      else alert('Use the Read Aloud control to hear this page. Audio will not start automatically.');
    });
    section.prepend(button);
  }

  function lineMatching() {
    if (section.dataset.sectionId !== 'pg017_sec001' || section.querySelector('.matrix-line-match')) return;
    const pairs = [['four','4'],['one','1'],['three','3'],['six','6'],['nine','9'],['eight','8'],['seven','7'],['five','5']];
    const panel = document.createElement('section'); panel.className = 'matrix-line-match';
    panel.setAttribute('aria-label', 'Draw lines to match words and numbers');
    panel.innerHTML = '<h2>Match each word to its number</h2><p>Select a word, then select its matching number. A line will show your match.</p><div class="matrix-match-board"><svg aria-hidden="true"></svg><div class="matrix-match-words"></div><div class="matrix-match-numbers"></div></div><button type="button" class="matrix-match-clear">Clear all lines</button><p class="matrix-match-feedback" aria-live="polite"></p>';
    const board = panel.querySelector('.matrix-match-board'), svg = panel.querySelector('svg'), words = panel.querySelector('.matrix-match-words'), numbers = panel.querySelector('.matrix-match-numbers'), feedback = panel.querySelector('.matrix-match-feedback');
    let selected = null; const matches = new Map();
    pairs.forEach(([word]) => { const b=document.createElement('button'); b.type='button'; b.textContent=word; b.dataset.word=word; b.setAttribute('aria-pressed','false'); words.appendChild(b); });
    ['8','3','5','7','9','2','1','4','6'].forEach(number => { const b=document.createElement('button'); b.type='button'; b.textContent=number; b.dataset.number=number; numbers.appendChild(b); });
    function redraw() { svg.replaceChildren(); const box=board.getBoundingClientRect(); matches.forEach((number,word)=>{ const a=words.querySelector('[data-word="'+word+'"]'), b=numbers.querySelector('[data-number="'+number+'"]'); const ar=a.getBoundingClientRect(), br=b.getBoundingClientRect(); const line=document.createElementNS('http://www.w3.org/2000/svg','line'); line.setAttribute('x1',ar.right-box.left); line.setAttribute('y1',ar.top+ar.height/2-box.top); line.setAttribute('x2',br.left-box.left); line.setAttribute('y2',br.top+br.height/2-box.top); line.setAttribute('stroke', word === numberName(number) ? '#15803d' : '#dc2626'); line.setAttribute('stroke-width','3'); svg.appendChild(line); }); }
    const numberName = n => ({'1':'one','2':'two','3':'three','4':'four','5':'five','6':'six','7':'seven','8':'eight','9':'nine'})[n];
    words.addEventListener('click', event => { const button=event.target.closest('button'); if(!button)return; selected=button.dataset.word; words.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button))); feedback.textContent='Now select the number for '+selected+'.'; });
    numbers.addEventListener('click', event => { const button=event.target.closest('button'); if(!button||!selected)return; matches.set(selected,button.dataset.number); selected=null; words.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false')); redraw(); const correct=[...matches].filter(([word,n])=>word===numberName(n)).length; feedback.textContent=correct+' of '+pairs.length+' matches are correct.'; });
    panel.querySelector('.matrix-match-clear').addEventListener('click',()=>{matches.clear(); redraw(); feedback.textContent='All lines cleared.';});
    window.addEventListener('resize',redraw); section.appendChild(panel);
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = '.matrix-audio-button{margin:.5rem 0 1rem;padding:.65rem 1rem;background:#075985;color:white;border:0;border-radius:.5rem;font-weight:700}.matrix-tracing-tool,.matrix-line-match{margin:1.5rem 0;padding:1rem;border:2px solid #0ea5e9;border-radius:1rem;background:#f0f9ff}.matrix-tracing-tool h2,.matrix-line-match h2{font-size:1.5rem;font-weight:700}.matrix-trace-card{display:grid;grid-template-columns:7rem minmax(12rem,1fr) auto;gap:.7rem;align-items:center;margin:.8rem 0;padding:.75rem;background:white;border-radius:.5rem}.matrix-trace-card canvas{width:100%;height:120px;border:2px dashed #94a3b8;touch-action:none}.matrix-trace-card textarea{grid-column:2/4;min-height:2.5rem;padding:.35rem}.matrix-trace-card button,.matrix-line-match button{padding:.5rem;border:1px solid #64748b;border-radius:.4rem;background:white}.matrix-match-board{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:35%;padding:.75rem 1rem;background:white;border-radius:.5rem}.matrix-match-board svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.matrix-match-words,.matrix-match-numbers{display:grid;gap:.45rem;z-index:1}.matrix-match-numbers button{justify-self:end;min-width:4rem}.matrix-match-words button[aria-pressed=true]{outline:3px solid #2563eb}@media(max-width:600px){.matrix-trace-card{grid-template-columns:1fr}.matrix-trace-card textarea{grid-column:auto}.matrix-match-board{gap:15%}}';
    document.head.appendChild(style);
  }
  addStyles(); hideUnneededInputs(); tracingTool(); manualAudio(); lineMatching();
})();
