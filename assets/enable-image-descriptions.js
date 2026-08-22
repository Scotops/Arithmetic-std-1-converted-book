/*
 * Keep image descriptions in the standard read-aloud sequence.
 * The setting is stored by the reader runtime, so set it before the runtime
 * starts on every page.  This uses the book's existing, single male narrator
 * recordings; it does not introduce browser speech synthesis.
 */
(() => {
  try {
    localStorage.setItem('describeImagesMode', 'true');
  } catch (_) {
    // The reader remains usable when persistent storage is unavailable.
  }
})();
