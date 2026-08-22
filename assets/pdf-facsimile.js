/* Present a visually exact, watermark-free source page while preserving the
   converted HTML for read-aloud, image descriptions, and assistive tools. */
(() => {
  const title = document.querySelector('meta[name="title-id"]')?.content || '';
  const match = title.match(/^pg(\d{3})_/);
  if (!match) return;
  const page = Number(match[1]);
  if (page < 1 || page > 132) return;
  const content = document.getElementById('content');
  const section = content?.querySelector('section[data-section-id]');
  if (!content || !section || content.querySelector('.pdf-page-facsimile')) return;
  const image = document.createElement('img');
  image.className = 'pdf-page-facsimile';
  image.src = `images/pdf-pages/pg-${String(page).padStart(3, '0')}.jpg?v=trim-c4d797b`;
  image.alt = `Printed page ${page} of Arithmetic Pupil's Book Standard One.`;
  image.decoding = 'async';
  section.classList.add('pdf-facsimile-accessible-source');
  content.prepend(image);
})();
