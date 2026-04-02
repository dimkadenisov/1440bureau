const EARTH_RADIUS_KM = 6371;

export interface OrbitalParams {
  altitudeKm: number;
  inclinationDeg: number;
  raanDeg: number; // Right Ascension of Ascending Node
  steps: number;
}

export type Vec3 = [number, number, number];

/** Convert geographic coordinates to 3D unit-sphere coordinates.
 *  Y is up (north pole). Radius 1 = Earth surface. */
export function latLonToVector3(lat: number, lon: number, radius = 1): Vec3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  ];
}

/** Generate orbital ring points in 3D space.
 *  Returns array of Vec3 at (1 + altitudeKm/EARTH_R) radius. */
export function generateOrbit({ altitudeKm, inclinationDeg, raanDeg, steps }: OrbitalParams): Vec3[] {
  const r = 1 + altitudeKm / EARTH_RADIUS_KM;
  const inc = inclinationDeg * (Math.PI / 180);
  const raan = raanDeg * (Math.PI / 180);

  const points: Vec3[] = [];
  for (let i = 0; i < steps; i++) {
    const u = (i / steps) * Math.PI * 2;

    // Position in orbital plane (x along line of nodes, y up)
    const xOrb = r * Math.cos(u);
    const yOrb = r * Math.sin(u);

    // Rotate by inclination around X axis
    const xEci = xOrb;
    const yEci = yOrb * Math.cos(inc);
    const zEci = yOrb * Math.sin(inc);

    // Rotate by RAAN around Y axis (Z axis in ECI)
    const x = xEci * Math.cos(raan) - zEci * Math.sin(raan);
    const y = yEci;
    const z = xEci * Math.sin(raan) + zEci * Math.cos(raan);

    points.push([x, y, z]);
  }
  return points;
}

/** Generate arc points between two Vec3 points on a sphere,
 *  elevating the midpoint by `arcHeight` for a parabolic arc effect. */
export function generateArcPoints(start: Vec3, end: Vec3, arcHeight: number, steps: number): Vec3[] {
  const points: Vec3[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    // Lerp
    const x = start[0] + (end[0] - start[0]) * t;
    const y = start[1] + (end[1] - start[1]) * t;
    const z = start[2] + (end[2] - start[2]) * t;
    // Normalise and add arc height (sin curve peaks at midpoint)
    const len = Math.sqrt(x * x + y * y + z * z);
    const elevation = 1 + arcHeight * Math.sin(Math.PI * t);
    points.push([x / len * elevation, y / len * elevation, z / len * elevation]);
  }
  return points;
}

/** Six Rassvet satellites — simulated orbital parameters.
 *  Rassvet-1: 3 sats at 550 km, ~97.5° SSO
 *  Rassvet-2: 3 sats at 800 km, ~98.6° SSO */
export const SATELLITES = [
  // Rassvet-1 (550 km SSO)
  { name: 'R1-A', altitudeKm: 550, inclinationDeg: 97.5, raanDeg: 0 },
  { name: 'R1-B', altitudeKm: 550, inclinationDeg: 97.5, raanDeg: 120 },
  { name: 'R1-C', altitudeKm: 550, inclinationDeg: 97.5, raanDeg: 240 },
  // Rassvet-2 (800 km SSO)
  { name: 'R2-A', altitudeKm: 800, inclinationDeg: 98.6, raanDeg: 60 },
  { name: 'R2-B', altitudeKm: 800, inclinationDeg: 98.6, raanDeg: 180 },
  { name: 'R2-C', altitudeKm: 800, inclinationDeg: 98.6, raanDeg: 300 },
] as const;
