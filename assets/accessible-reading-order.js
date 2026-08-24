/*
 * Read-aloud repairs for the printed-book presentation.
 *
 * The reader builds its playlist from source elements carrying data-id in DOM
 * order. Some pages include a second, responsive copy of the same table.
 * Only the copy visible at the current screen size belongs in the playlist.
 * This preserves the visual PDF page while removing duplicate narration.
 */
(() => {
  'use strict';

  const textFixes = {
    pg043_n0035: 'dash',
    pg043_n0060: 'dash'
  };

  const pipeline = window.ADT_TTS_PIPELINE;

  const audioFixes = {
    pg043_n0035: 'pg043_n0035.revised.wav?v=audio-audit-20260824',
    pg043_n0060: 'pg043_n0060.revised.wav?v=audio-audit-20260824',
    pg100_n0070: 'pg100_n0070.revised.wav?v=audio-audit-20260824',
    pg100_n0075: 'pg100_n0075.revised.wav?v=audio-audit-20260824',
    pg100_n0079: 'pg100_n0079.revised.wav?v=audio-audit-20260824',
    pg100_n0083: 'pg100_n0083.revised.wav?v=audio-audit-20260824'
  };

  const isVisibleForReading = (element) => {
    for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
      if (getComputedStyle(node).display === 'none') return false;
    }
    return true;
  };

  const keepOnlyTheVisibleCopy = () => {
    const root = document.getElementById('content');
    if (!root) return;
    const all = Array.from(root.querySelectorAll('[data-id]'));
    const kept = new Set(pipeline ? pipeline.deduplicate(pipeline.extract(root)) : all);
    all.forEach((element) => {
      // Screen-reader labels embedded in print tables, hidden answer keys,
      // responsive copies, and duplicate image captions are not independent
      // pieces of book content.
      if (element.closest('label.sr-only') || !kept.has(element)) element.removeAttribute('data-id');
    });
  };

  /*
   * The source book often prints a numbered exercise in several columns.
   * Its HTML therefore follows the print row (1, 7, 13, then 2, 8, 14),
   * while a child listening to the book needs the mathematical sequence
   * (1, 2, 3, ...).  Build an audio-only copy of the reading targets for
   * these grids.  The printed elements retain their exact appearance; only
   * the read-aloud playlist receives the reordered targets.
   */
  const questionNumber = (element) => {
    const match = (element.textContent || '').trim().match(/^(\d{1,3})\.(?:\s|$)/);
    return match ? Number(match[1]) : null;
  };

  const orderedGridChildren = (grid) => {
    const children = Array.from(grid.children);
    const numbered = children.map((child, index) => {
      const marker = Array.from(child.querySelectorAll('[data-id]'))
        .find((element) => questionNumber(element) !== null);
      return marker ? { child, index, number: questionNumber(marker) } : null;
    });
    const questions = numbered.filter(Boolean);

    // A two-cell table is not a numbered exercise.  Reorder only genuine
    // question grids that contain at least three distinct item numbers.
    if (questions.length < 3 || new Set(questions.map((item) => item.number)).size < 3) {
      return null;
    }
    const original = questions.map((item) => item.number);
    const sorted = [...questions].sort((a, b) => a.number - b.number || a.index - b.index);
    if (original.every((number, index) => number === sorted[index].number)) return null;

    const questionChildren = new Set(questions.map((item) => item.child));
    const otherChildren = children.filter((child) => !questionChildren.has(child));
    return [...sorted.map((item) => item.child), ...otherChildren];
  };

  const makeNarrationTarget = (element) => {
    const isImage = element.tagName.toLowerCase() === 'img';
    const target = document.createElement(isImage ? 'img' : 'span');
    target.className = 'adt-reading-target';
    target.setAttribute('data-id', element.getAttribute('data-id'));
    if (isImage) {
      target.setAttribute('alt', element.getAttribute('alt') || '');
    } else {
      target.textContent = element.textContent || '';
    }
    return target;
  };

  const rebuildNarrationQueue = () => {
    const root = document.getElementById('content');
    if (!root) return;

    const sourceItems = pipeline ? pipeline.deduplicate(pipeline.extract(root)) : Array.from(root.querySelectorAll('[data-id]'));
    const excluded = new Set();
    const replacements = new Map();
    const ordered = [];

    // Replace each out-of-order numbered grid with the same children, sorted
    // by its printed item number.  All remaining page content stays in DOM
    // order, which is already its intended reading order.
    root.querySelectorAll('.grid').forEach((grid) => {
      const children = orderedGridChildren(grid);
      if (!children) return;
      const originalItems = Array.from(grid.querySelectorAll('[data-id]'));
      if (!originalItems.length) return;
      originalItems.forEach((element) => excluded.add(element));
      const replacement = [];
      children.forEach((child) => {
        child.querySelectorAll('[data-id]').forEach((element) => replacement.push(element));
      });
      replacements.set(originalItems[0], replacement);
    });

    sourceItems.forEach((element) => {
      const replacement = replacements.get(element);
      if (replacement) ordered.push(...replacement);
      else if (!excluded.has(element)) ordered.push(element);
    });

    // Do not read the same element twice if a grid is nested in another grid.
    const unique = [];
    const seen = new Set();
    ordered.forEach((element) => {
      if (!seen.has(element)) {
        seen.add(element);
        unique.push(element);
      }
    });

    if (!unique.length) return;
    // Save the final queue before removing source IDs. The visible page uses
    // its native print layout; these snapshots power safe console validation.
    const debugItems = unique.map((element, index) => ({
      index: index + 1,
      id: element.getAttribute('data-id'),
      text: pipeline?.normalize(element.textContent || element.getAttribute('alt') || '') || ''
    }));
    pipeline?.cancelPreviousSpeech();
    // Capture IDs before clearing the visual elements.  The visible page
    // becomes presentation-only; the hidden targets carry the audio IDs.
    const targets = unique.map(makeNarrationTarget);
    sourceItems.forEach((element) => element.removeAttribute('data-id'));
    const queue = document.createElement('div');
    queue.className = 'adt-reading-queue';
    queue.setAttribute('aria-hidden', 'true');
    queue.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
    targets.forEach((target) => queue.appendChild(target));
    root.appendChild(queue);
    window.ADT_TTS_DEBUG = Object.freeze({
      queue: () => debugItems.map((item) => ({ ...item })),
      matrix: (selector) => pipeline?.summarizeMatrix(root.querySelector(selector)) || []
    });
  };

  const patchLocalizedFetches = () => {
    const fetchFromBook = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      const response = await fetchFromBook(input, init);
      if (!/content\/i18n\/en-US\/(texts|audios)\.json(?:[?#]|$)/.test(url)) return response;

      const data = await response.json();
      if (/texts\.json(?:[?#]|$)/.test(url)) Object.assign(data, textFixes);
      else Object.assign(data, audioFixes);
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'application/json' }
      });
    };
  };

  keepOnlyTheVisibleCopy();
  rebuildNarrationQueue();
  patchLocalizedFetches();
})();
