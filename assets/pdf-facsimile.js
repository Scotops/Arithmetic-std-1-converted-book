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

  // Corrected exercise instructions. Keep the printed-page view and its
  // readable source text aligned without altering the book artwork.
  const correctedInstructions = {
    12: {
      text: 'Count and say / identify the number of objects in each group.',
      top: '13.3%', left: '11%', width: '78%', minHeight: '6.8%', fontSize: '2.8vw'
    },
    14: {
      text: 'By using accessible tools, draw a line to match the objects and their number.',
      top: '12.1%', left: '9.5%', width: '79%', minHeight: '5.2%', fontSize: '2.35vw'
    },
    16: [
      {
        text: 'Read aloud / sign the following numbers.',
        top: '38.5%', left: '10%', width: '77%', minHeight: '4.2%', fontSize: '2.55vw'
      },
      {
        text: 'Read aloud / sign the following numbers.',
        top: '76.8%', left: '10%', width: '77%', minHeight: '4.2%', fontSize: '2.55vw'
      }
    ],
    17: {
      text: 'By using accessible tools, draw lines to match each word with its number.',
      top: '12.8%', left: '10%', width: '79%', minHeight: '6%', fontSize: '2.35vw'
    },
    18: {
      text: 'Read aloud / sign the following numbers.',
      top: '13.2%', left: '10%', width: '77%', minHeight: '4.2%', fontSize: '2.55vw'
    },
    25: {
      text: 'Read aloud / sign the following numbers.',
      top: '52.8%', left: '11%', width: '76%', minHeight: '4.2%', fontSize: '2.55vw'
    },
    28: {
      text: 'By using accessible tools / draw pictures to represent the sum of each of the following objects.',
      top: '72.4%', left: '10%', width: '78%', minHeight: '6.2%', fontSize: '1.85vw'
    },
    40: {
      text: 'Read / identify the question that appears on the screen clearly.',
      top: '20.5%', left: '17%', width: '70%', minHeight: '7.2%', fontSize: '2.25vw'
    },
    41: {
      text: 'By using accessible tools, draw the remaining objects after taking away.',
      top: '68.4%', left: '12%', width: '78%', minHeight: '5.5%', fontSize: '1.9vw'
    },
    51: {
      text: 'Read / identify the question that appears on the screen clearly.',
      top: '71.8%', left: '17%', width: '76%', minHeight: '7.6%', fontSize: '2.05vw'
    }
  };
  const instructions = correctedInstructions[page]
    ? (Array.isArray(correctedInstructions[page]) ? correctedInstructions[page] : [correctedInstructions[page]])
    : [];
  if (instructions.length) {
    content.style.position = 'relative';
  }
  instructions.forEach((instruction) => {
    const correction = document.createElement('p');
    correction.className = 'pdf-page-text-correction';
    correction.textContent = instruction.text;
    correction.style.cssText = [
      'position:absolute', 'z-index:1', `top:${instruction.top}`, `left:${instruction.left}`,
      `width:${instruction.width}`, `min-height:${instruction.minHeight}`,
      'margin:0', 'padding:0.5% 1.5%', 'box-sizing:border-box',
      'background:#fff', 'color:#222', "font-family:'Comic Sans MS','Comic Sans',cursive",
      `font-size:${instruction.fontSize}`, 'font-style:italic', 'font-weight:400', 'line-height:1.3'
    ].join(';');
    content.append(correction);
  });
})();
