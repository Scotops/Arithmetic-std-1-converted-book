/* Remove the transient visual word-overlay added by read-aloud.  It is not
   part of the source book and, unlike the audio, must never cover print. */
(() => {
  const isYellowHighlight = (node) => {
    if (!(node instanceof HTMLElement)) return false;
    const text = node.textContent.replace(/\s+/g, ' ').trim();
    if (!/^Exercise(?:\s+\d+)?$/.test(text)) return false;
    const { backgroundColor } = getComputedStyle(node);
    const values = backgroundColor.match(/\d+(?:\.\d+)?/g)?.map(Number);
    if (!values || values.length < 3) return false;
    const [red, green, blue] = values;
    return red > 190 && green > 160 && blue < 150;
  };
  const remove = (root = document) => {
    root.querySelectorAll?.('mark, span, div, strong, b').forEach((node) => {
      if (isYellowHighlight(node) && node.style.display !== 'none') {
        node.style.setProperty('display', 'none', 'important');
      }
    });
  };
  remove();
  new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) remove(node);
      });
      if (record.type === 'attributes' && record.target instanceof HTMLElement) remove(record.target.parentElement || document);
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
})();
