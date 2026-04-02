import { describe, it, expect } from 'vitest';
import {
  latLonToVector3,
  generateOrbit,
  generateArcPoints,
  SATELLITES,
} from './OrbitalData';

describe('latLonToVector3', () => {
  it('converts equatorial point correctly', () => {
    const v = latLonToVector3(0, 0, 1);
    expect(v[0]).toBeCloseTo(1, 5);
    expect(v[1]).toBeCloseTo(0, 5);
    expect(v[2]).toBeCloseTo(0, 5);
  });

  it('converts north pole correctly', () => {
    const v = latLonToVector3(90, 0, 1);
    expect(v[0]).toBeCloseTo(0, 5);
    expect(v[1]).toBeCloseTo(1, 5);
    expect(v[2]).toBeCloseTo(0, 5);
  });
});

describe('generateOrbit', () => {
  it('returns array of 3D points', () => {
    const points = generateOrbit({ altitudeKm: 550, inclinationDeg: 97.5, raanDeg: 0, steps: 64 });
    expect(points).toHaveLength(64);
    expect(points[0]).toHaveLength(3);
  });

  it('all orbit points at roughly correct radius', () => {
    const EARTH_R = 1;
    const ALT = 550 / 6371;
    const R = EARTH_R + ALT;
    const points = generateOrbit({ altitudeKm: 550, inclinationDeg: 97.5, raanDeg: 0, steps: 32 });
    for (const p of points) {
      const r = Math.sqrt(p[0] ** 2 + p[1] ** 2 + p[2] ** 2);
      expect(r).toBeCloseTo(R, 3);
    }
  });
});

describe('generateArcPoints', () => {
  it('generates arc between two points', () => {
    const arc = generateArcPoints([0, 1, 0], [1, 0, 0], 0.3, 32);
    expect(arc.length).toBe(32);
  });
});

describe('SATELLITES', () => {
  it('has 6 satellites', () => {
    expect(SATELLITES).toHaveLength(6);
  });
});
