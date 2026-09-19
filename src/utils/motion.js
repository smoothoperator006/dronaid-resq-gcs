export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Returns `steps` intermediate [lat,lng] points from `from` to `to`, not including `from`. */
export function interpolatePath(from, to, steps) {
  const points = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    points.push([lerp(from[0], to[0], t), lerp(from[1], to[1], t)]);
  }
  return points;
}
