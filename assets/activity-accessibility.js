/*
 * Accessible activity fallbacks for the Arithmetic Standard One reader.
 * This layer turns visual-only answer spaces into usable form controls while
 * preserving the original page artwork and the ADT runtime.
 */
(function () {
  'use strict';

  const WORD_NUMBERS = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10' };
  const itemNumber = (key) => Number((key.match(/(\d+)$/) || [])[1] || 0);
  const answers = () => window.correctAnswers && typeof window.correctAnswers === 'object' ? window.correctAnswers : {};
  const orderedAnswers = () => Object.entries(answers()).sort((a, b) => itemNumber(a[0]) - itemNumber(b[0]));
  const normalise = (value) => String(value || '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
  const saveKey = () => 'adt-activity:' + (document.querySelector('meta[name="title-id"]') || {}).content;

  function style() {
    if (document.getElementById('adt-accessible-activity-style')) return;
    const el = document.createElement('style');
    el.id = 'adt-accessible-activity-style';
    el.textContent = `
      .adt-answer { min-width: 5rem; min-height: 2.5rem; padding: .3rem .5rem; border: 2px solid #64748b; border-radius: .35rem; background: #fff; color: #111827; font: inherit; text-align: center; }
      .adt-answer:focus, .adt-match-select:focus, .adt-open-response:focus { outline: 3px solid #2563eb; outline-offset: 2px; }
      .adt-activity-actions { display:flex; flex-wrap:wrap; gap:.75rem; align-items:center; margin:1.25rem 0; }
      .adt-check-button { padding:.65rem 1rem; border:0; border-radius:.5rem; background:#075985; color:#fff; font-weight:700; cursor:pointer; }
      .adt-check-button:hover { background:#0c4a6e; }
      .adt-feedback { font-weight:700; } .adt-feedback.good { color:#15803d; } .adt-feedback.bad { color:#b91c1c; }
      .adt-match-panel { margin-top:1.25rem; padding:1rem; border:2px solid #0891b2; border-radius:.75rem; background:#f0fdfa; }
      .adt-match-row { display:grid; grid-template-columns:minmax(0,1fr) minmax(10rem,.7fr); gap:1rem; align-items:center; padding:.65rem 0; border-bottom:1px solid #a5f3fc; }
      .adt-match-row:last-of-type { border-bottom:0; } .adt-match-select { min-height:2.5rem; padding:.25rem; border:2px solid #0e7490; border-radius:.35rem; background:#fff; font:inherit; }
      .adt-open-response { display:block; width:100%; min-height:7rem; margin-top:.75rem; padding:.5rem; border:2px solid #64748b; border-radius:.5rem; font:inherit; }
      @media (max-width: 480px) { .adt-match-row { grid-template-columns:1fr; gap:.35rem; } }
    `;
    document.head.appendChild(el);
  }

  function addActions(section, controls, checker, label) {
    if (section.querySelector('.adt-activity-actions')) return;
    const box = document.createElement('div'); box.className = 'adt-activity-actions';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'adt-check-button'; button.textContent = label || 'Check my answers';
    const feedback = document.createElement('p'); feedback.className = 'adt-feedback'; feedback.setAttribute('aria-live', 'polite');
    button.addEventListener('click', () => {
      const result = checker();
      feedback.textContent = result.message; feedback.className = 'adt-feedback ' + (result.ok ? 'good' : 'bad');
      try { localStorage.setItem(saveKey(), JSON.stringify(controls.map(c => c.value || ''))); } catch (_) {}
    });
    box.append(button, feedback); section.appendChild(box);
    try { const prior = JSON.parse(localStorage.getItem(saveKey()) || '[]'); controls.forEach((c, i) => { if (prior[i] && !c.value) c.value = prior[i]; }); } catch (_) {}
  }

  function enhanceBlanks(section) {
    // Pages that already provide the ADT's native answer fields are left to
    // the reader runtime; their visual underline is only decorative.
    if (section.querySelector('input[data-activity-item], input[data-aria-id]')) return false;
    const expected = orderedAnswers().map(entry => String(entry[1]));
    if (!expected.length) return false;
    let spaces = Array.from(section.querySelectorAll('.fitb-sentence span, .blank, .answer-blank')).filter(el => !el.textContent.trim() && !el.querySelector('input'));
    if (!spaces.length) {
      // Some source pages use printed underscores instead of an empty box.
      // Replace each underscore run with a real field, retaining all question text.
      section.querySelectorAll('.fitb-sentence').forEach(sentence => {
        if (sentence.querySelector('input') || !/_{2,}/.test(sentence.textContent)) return;
        const walker = document.createTreeWalker(sentence, NodeFilter.SHOW_TEXT);
        const nodes = []; let node;
        while ((node = walker.nextNode())) if (/_{2,}/.test(node.nodeValue)) nodes.push(node);
        nodes.forEach(textNode => {
          const fragment = document.createDocumentFragment();
          const parts = textNode.nodeValue.split(/(_{2,})/);
          parts.forEach(part => {
            if (/^_{2,}$/.test(part)) { const placeholder = document.createElement('span'); placeholder.className = 'adt-underscore-space'; fragment.appendChild(placeholder); spaces.push(placeholder); }
            else fragment.appendChild(document.createTextNode(part));
          });
          textNode.parentNode.replaceChild(fragment, textNode);
        });
      });
    }
    if (!spaces.length) return false;
    const controls = spaces.map((space, index) => {
      const input = document.createElement('input'); input.type = 'text'; input.inputMode = 'numeric'; input.autocomplete = 'off'; input.className = 'adt-answer';
      input.setAttribute('aria-label', 'Answer ' + (index + 1)); input.dataset.expected = expected[index] || '';
      space.replaceChildren(input); return input;
    });
    addActions(section, controls, () => {
      let correct = 0, missing = 0;
      controls.forEach(input => { const ok = normalise(input.value) === normalise(input.dataset.expected); if (!input.value.trim()) missing++; input.setAttribute('aria-invalid', String(!ok)); input.style.borderColor = ok ? '#16a34a' : '#dc2626'; if (ok) correct++; });
      return { ok: correct === controls.length, message: missing ? 'Please answer all ' + controls.length + ' questions.' : correct === controls.length ? 'Excellent! All ' + correct + ' answers are correct.' : correct + ' of ' + controls.length + ' answers are correct. Try the highlighted answers again.' };
    });
    return true;
  }

  function enhanceMatching(section) {
    const hiddenItems = Array.from(section.querySelectorAll('.activity-item'));
    const zones = Array.from(section.querySelectorAll('.dropzone')).map(zone => ({ id: (zone.querySelector('[id^="dropzone-"]') || {}).id, label: zone.getAttribute('aria-label') || zone.textContent.trim() }));
    let pairs = [];
    if (hiddenItems.length && zones.length) {
      pairs = hiddenItems.map(item => { const target = answers()[item.dataset.activityItem]; const zone = zones.find(z => z.id === target); return { label: item.getAttribute('aria-label') || item.textContent.trim(), answer: (zone || {}).label || target }; });
    } else if (section.querySelector('table')) {
      const rows = Array.from(section.querySelectorAll('table tr'));
      const shapeName = (cell) => {
        const svg = cell.querySelector('svg'); if (!svg) return cell.textContent.trim();
        if (svg.querySelector('circle')) return 'Circle';
        if (svg.querySelector('ellipse')) return 'Oval';
        const poly = svg.querySelector('polygon');
        if (poly) { const points = poly.getAttribute('points') || ''; return points.split(' ').length === 3 ? 'Triangle' : points.split(' ').length === 5 ? 'Pentagon' : points.split(' ').length > 5 ? 'Star' : 'Kite'; }
        const rect = svg.querySelector('rect');
        if (rect) return rect.getAttribute('width') === rect.getAttribute('height') ? 'Square' : 'Rectangle';
        return 'Figure';
      };
      const figures = rows.map(row => shapeName(row.cells[2] || row));
      pairs = rows.map((row, index) => {
        const label = (row.cells[1] || {}).textContent || '';
        const target = answers()['item-' + (index + 1)] || '';
        const targetIndex = itemNumber(target) - 1;
        return { label: label.trim(), answer: figures[targetIndex] || '' };
      }).filter(p => p.label && p.answer);
    } else {
      const grids = Array.from(section.querySelectorAll('.grid')).filter(grid => grid.children.length >= 4);
      const grid = grids.sort((a, b) => b.children.length - a.children.length)[0];
      if (grid) {
        const children = Array.from(grid.children); const left = children.filter((_, i) => i % 2 === 0).slice(1); const right = children.filter((_, i) => i % 2 === 1).slice(1);
        pairs = left.map((el, i) => {
          const label = el.textContent.trim();
          const token = normalise(label).split(' ')[0];
          return { label, answer: WORD_NUMBERS[token] || (right[i] ? right[i].textContent.trim() : '') };
        }).filter(p => p.label && p.answer);
      }
    }
    if (!pairs.length || section.querySelector('.adt-match-panel')) return false;
    const choices = [...new Set(pairs.map(p => p.answer))];
    const panel = document.createElement('fieldset'); panel.className = 'adt-match-panel';
    const legend = document.createElement('legend'); legend.textContent = 'Match each item using the drop-down lists'; legend.style.fontWeight = '700'; panel.appendChild(legend);
    const controls = pairs.map((pair, index) => {
      const row = document.createElement('label'); row.className = 'adt-match-row';
      const prompt = document.createElement('span'); prompt.textContent = pair.label;
      const select = document.createElement('select'); select.className = 'adt-match-select'; select.setAttribute('aria-label', 'Match for ' + pair.label); select.dataset.expected = pair.answer;
      select.append(new Option('Choose an answer', '')); choices.forEach(choice => select.append(new Option(choice, choice))); row.append(prompt, select); panel.appendChild(row); return select;
    });
    section.appendChild(panel);
    addActions(section, controls, () => {
      let correct = 0; controls.forEach(select => { const ok = normalise(select.value) === normalise(select.dataset.expected); select.setAttribute('aria-invalid', String(!ok)); select.style.borderColor = ok ? '#16a34a' : '#dc2626'; if (ok) correct++; });
      return { ok: correct === controls.length, message: correct === controls.length ? 'Excellent! Every match is correct.' : correct + ' of ' + controls.length + ' matches are correct. Try again.' };
    });
    return true;
  }

  function addOpenResponse(section, instruction) {
    if (section.querySelector('textarea, input, canvas, .adt-open-response')) return;
    const label = document.createElement('label'); label.textContent = instruction || 'Type your answer or explain what you did:';
    const response = document.createElement('textarea'); response.className = 'adt-open-response'; response.setAttribute('aria-label', label.textContent); label.appendChild(response); section.appendChild(label);
    addActions(section, [response], () => ({ ok: Boolean(response.value.trim()), message: response.value.trim() ? 'Your answer has been saved.' : 'Please enter your answer before submitting.' }), 'Save my answer');
  }

  function canvasAlternative(section) {
    const canvases = Array.from(section.querySelectorAll('canvas.draw-canvas'));
    if (!canvases.length) return;
    canvases.forEach((canvas, i) => {
      canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Drawing area ' + (i + 1) + '. Use a mouse or touch to draw. A text alternative is below.');
      const label = document.createElement('label'); label.textContent = 'Text alternative for drawing ' + (i + 1) + ' (optional):';
      const text = document.createElement('textarea'); text.className = 'adt-open-response'; text.style.minHeight = '4rem'; text.placeholder = 'Describe your drawing or answer using words.'; label.appendChild(text); canvas.parentElement.parentElement.appendChild(label);
    });
  }

  function init() {
    style();
    document.querySelectorAll('[data-section-type^="activity_"]').forEach(section => {
      const type = section.dataset.sectionType;
      if (type === 'activity_fill_in_the_blank') enhanceBlanks(section);
      else if (type === 'activity_matching') enhanceMatching(section);
      else if (type === 'activity_other' || type === 'activity_open_ended_answer') addOpenResponse(section);
      canvasAlternative(section);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100)); else setTimeout(init, 100);
})();
