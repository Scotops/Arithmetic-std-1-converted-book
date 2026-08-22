(() => {
  const removeSpokenOnlyDash = (root = document) => {
    const nodes = root.querySelectorAll?.('span[aria-hidden="true"]') || [];
    for (const node of nodes) {
      if (node.textContent.trim().toLowerCase() === 'dash' && node.style.display === 'none') {
        node.remove();
      }
    }
  };

  removeSpokenOnlyDash();
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          removeSpokenOnlyDash(node.parentElement || document);
        }
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
