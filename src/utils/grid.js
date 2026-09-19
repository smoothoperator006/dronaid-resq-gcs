/** Builds a rows x cols grid covering the zones' bounding box (plus padding). */
export function buildGrid(zones, rows = 4, cols = 6, paddingRatio = 0.4) {
  const lats = zones.map((z) => z.lat);
  const lngs = zones.map((z) => z.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const padLat = (maxLat - minLat) * paddingRatio;
  const padLng = (maxLng - minLng) * paddingRatio;

  const top = maxLat + padLat;
  const bottom = minLat - padLat;
  const left = minLng - padLng;
  const right = maxLng + padLng;

  const cellH = (top - bottom) / rows;
  const cellW = (right - left) / cols;

  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellTop = top - r * cellH;
      const cellBottom = cellTop - cellH;
      const cellLeft = left + c * cellW;
      const cellRight = cellLeft + cellW;
      cells.push({
        id: `${r}-${c}`,
        row: r,
        col: c,
        bounds: [
          [cellBottom, cellLeft],
          [cellTop, cellRight]
        ],
        center: [(cellTop + cellBottom) / 2, (cellLeft + cellRight) / 2]
      });
    }
  }

  function cellForPoint(lat, lng) {
    let c = Math.floor((lng - left) / cellW);
    let r = Math.floor((top - lat) / cellH);
    c = Math.min(cols - 1, Math.max(0, c));
    r = Math.min(rows - 1, Math.max(0, r));
    return `${r}-${c}`;
  }

  return { rows, cols, bounds: [[bottom, left], [top, right]], cells, cellForPoint };
}

/** Boustrophedon (lawnmower) scan order, restricted to a column range — one drone's half of the grid. */
export function sweepOrder(rows, colStart, colEnd) {
  const order = [];
  for (let r = 0; r < rows; r++) {
    const cols = [];
    for (let c = colStart; c <= colEnd; c++) cols.push(c);
    if (r % 2 === 1) cols.reverse();
    cols.forEach((c) => order.push(`${r}-${c}`));
  }
  return order;
}

export function cellCenterOf(grid, cellId) {
  const cell = grid.cells.find((c) => c.id === cellId);
  return cell ? cell.center : null;
}
