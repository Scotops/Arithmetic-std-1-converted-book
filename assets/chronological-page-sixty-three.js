/* Keep the visual two-column list while read-aloud follows items 1 through 18. */
(() => {
  const grid = document.querySelector('[data-section-id="pg063_sec001"] .grid');
  if (!grid) return;

  const pairs = [
    ['pg063_n0015', 'pg063_n0017'], ['pg063_n0024', 'pg063_n0026'],
    ['pg063_n0033', 'pg063_n0035'], ['pg063_n0042', 'pg063_n0044'],
    ['pg063_n0051', 'pg063_n0053'], ['pg063_n0060', 'pg063_n0062'],
    ['pg063_n0069', 'pg063_n0071'], ['pg063_n0078', 'pg063_n0080'],
    ['pg063_n0087', 'pg063_n0089'], ['pg063_n0019', 'pg063_n0021'],
    ['pg063_n0028', 'pg063_n0030'], ['pg063_n0037', 'pg063_n0039'],
    ['pg063_n0046', 'pg063_n0048'], ['pg063_n0055', 'pg063_n0057'],
    ['pg063_n0064', 'pg063_n0066'], ['pg063_n0073', 'pg063_n0075'],
    ['pg063_n0082', 'pg063_n0084'], ['pg063_n0091', 'pg063_n0093']
  ];

  pairs.forEach(([numberId, wordId], index) => {
    const row = (index % 9) + 1;
    const column = index < 9 ? 1 : 3;
    [numberId, wordId].forEach((id, offset) => {
      const cell = grid.querySelector(`:scope > [data-id="${id}"]`);
      if (!cell) return;
      cell.style.gridRow = String(row);
      cell.style.gridColumn = String(column + offset);
      grid.append(cell);
    });
  });
})();
