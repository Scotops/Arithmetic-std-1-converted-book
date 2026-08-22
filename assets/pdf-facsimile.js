/* Present a visually exact, watermark-free source page while preserving the
   converted HTML for read-aloud, image descriptions, and assistive tools. */
(() => {
  const title = document.querySelector('meta[name="title-id"]')?.content || '';
  const match = title.match(/^pg(\d{3})_/);
  if (!match) return;
  const page = Number(match[1]);
  if (page < 1 || page > 132) return;
  const content = document.getElementById('content');
  const sections = content?.querySelectorAll('section[data-section-id]');
  if (!content || !sections?.length || content.querySelector('.pdf-page-facsimile')) return;
  const image = document.createElement('img');
  image.className = 'pdf-page-facsimile';
  image.src = `images/pdf-pages/pg-${String(page).padStart(3, '0')}.jpg?v=trim-c4d797b`;
  image.alt = `Printed page ${page} of Arithmetic Pupil's Book Standard One.`;
  image.decoding = 'async';
  /* Some source pages were converted into two or more HTML sections.  All of
     them must stay in the accessibility tree but none may appear below the
     printed PDF page. */
  sections.forEach((section) => section.classList.add('pdf-facsimile-accessible-source'));
  content.prepend(image);

  // Page 12 has a corrected exercise instruction. Keep the printed-page view
  // and its readable source text aligned without altering the artwork.
  if (page === 12) {
    const correction = document.createElement('p');
    correction.className = 'pdf-page-text-correction';
    correction.textContent = 'Count and say / identify the number of objects in each group.';
    correction.style.cssText = [
      'position:absolute', 'z-index:1', 'top:13.3%', 'left:11%', 'width:78%',
      'min-height:6.8%', 'margin:0', 'padding:0.5% 1.5%', 'box-sizing:border-box',
      'background:#fff', 'color:#222', "font-family:'Comic Sans MS','Comic Sans',cursive",
      'font-size:2.8vw', 'font-style:italic', 'font-weight:400', 'line-height:1.45'
    ].join(';');
    content.style.position = 'relative';
    content.append(correction);
  }
})();
