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
    const firstById = new Map();
    document.querySelectorAll('#content [data-id]').forEach((element) => {
      // Screen-reader labels inside printed answer tables repeat the column
      // headings. The headings themselves are already read once.
      if (element.closest('label.sr-only')) {
        element.removeAttribute('data-id');
        return;
      }

      const id = element.getAttribute('data-id');
      if (!id) return;
      const visible = isVisibleForReading(element);
      const prior = firstById.get(id);
      if (!prior) {
        firstById.set(id, { element, visible });
        return;
      }

      if (!visible) {
        element.removeAttribute('data-id');
      } else if (!prior.visible) {
        prior.element.removeAttribute('data-id');
        firstById.set(id, { element, visible: true });
      }
      // If both copies are visible, they represent separate printed content
      // and must remain in the spoken sequence.
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
  patchLocalizedFetches();
})();
