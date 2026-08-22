/*
 * Read-only textbook mode.
 *
 * The source book is presented as a digital copy of the printed pupil's
 * book.  Exercises retain their questions and blank answer spaces, but no
 * controls can receive, check, save, or submit an answer.
 */
(function () {
  'use strict';

  function addStyles() {
    if (document.getElementById('adt-static-textbook-style')) return;
    const style = document.createElement('style');
    style.id = 'adt-static-textbook-style';
    style.textContent = `
      .adt-static-answer-space {
        display: inline-block;
        box-sizing: border-box;
        min-width: 5rem;
        min-height: 2.5rem;
        vertical-align: middle;
        pointer-events: none;
        user-select: none;
      }
      .adt-static-drawing-space {
        display: block;
        min-height: 8rem;
        box-sizing: border-box;
        pointer-events: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
  }

  function blankFor(control) {
    const blank = document.createElement('span');
    blank.className = `${control.className || ''} adt-static-answer-space`.trim();
    blank.setAttribute('aria-hidden', 'true');
    // Answer values belong to an interactive exercise, not to the printed page.
    blank.removeAttribute('tabindex');
    return blank;
  }

  function drawingSpaceFor(canvas) {
    const blank = document.createElement('div');
    blank.className = `${canvas.className || ''} adt-static-drawing-space`.trim();
    blank.setAttribute('aria-hidden', 'true');
    blank.style.width = canvas.style.width || (canvas.width ? `${canvas.width}px` : '100%');
    blank.style.height = canvas.style.height || (canvas.height ? `${canvas.height}px` : '8rem');
    return blank;
  }

  function makeStatic() {
    const content = document.querySelector('#content');
    if (!content) return;

    content.querySelectorAll('[data-section-type^="activity_"]').forEach((section) => {
      section.dataset.sectionType = 'textbook_page';
      section.removeAttribute('data-correct-answers');
      section.removeAttribute('data-option-explanations');
      section.removeAttribute('data-area-id');
    });

    content.querySelectorAll('[data-submit-target], .adt-activity-actions, .adt-match-panel, .matrix-tracing-tool, .matrix-line-match, .feedback-container, .validation-mark').forEach((element) => element.remove());
    content.querySelectorAll('button').forEach((button) => button.remove());

    // Keep the answer space that is printed in the source book, but replace
    // the live form control with an inert visual equivalent. The source
    // classes preserve whether it is an underline or a box.
    content.querySelectorAll('input, textarea, select').forEach((control) => {
      if (control.matches('input[type="radio"], input[type="checkbox"]')) {
        control.remove();
      } else {
        control.replaceWith(blankFor(control));
      }
    });
    content.querySelectorAll('canvas').forEach((canvas) => canvas.replaceWith(drawingSpaceFor(canvas)));

    content.querySelectorAll('[data-activity-item], [data-aria-id]').forEach((element) => {
      element.removeAttribute('data-activity-item');
      element.removeAttribute('data-aria-id');
      element.removeAttribute('tabindex');
    });
    content.querySelectorAll('.activity-option').forEach((option) => option.removeAttribute('tabindex'));
  }

  function init() {
    addStyles();
    makeStatic();
    const content = document.querySelector('#content');
    if (content) new MutationObserver(makeStatic).observe(content, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
