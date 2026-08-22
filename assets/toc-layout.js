/* Keep the established narration IDs intact while visually separating the
   printed page number from its table-of-contents entry. */
(() => {
  const formatEntries = () => {
    document.querySelectorAll('[data-toc-entry]').forEach((entry) => {
      const text = entry.querySelector('p [data-id]');
      if (!text) return;
      const visible = text.textContent.trim();
      if (text.dataset.tocTitle === visible) return;
      const match = visible.match(/^(.*?)(?:\s+)(\d+)$/);
      if (!match) return;
      text.textContent = match[1];
      text.dataset.tocTitle = match[1];
      let page = entry.querySelector('.toc-page-number');
      if (!page) {
        page = document.createElement('span');
        page.className = 'toc-page-number';
        page.setAttribute('aria-hidden', 'true');
        entry.append(page);
      }
      page.textContent = match[2];
    });
  };
  formatEntries();
  /* The reader replaces localized text shortly after its scripts load.  Two
     delayed passes cover that replacement without a permanent document-wide
     observer that could interfere with the reader's own DOM updates. */
  setTimeout(formatEntries, 350);
  setTimeout(formatEntries, 1400);
  window.addEventListener('load', formatEntries, { once: true });
})();
