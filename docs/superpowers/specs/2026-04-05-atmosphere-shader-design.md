# Atmosphere Shader — Soft Outer Edge

**Date:** 2026-04-05  
**File:** `src/components/globe/GlobeRenderer.ts` → `addAtmosphere()`

## Problem

Current rim formula uses `pow(max(1 - cosA/0.75, 0), 2.0)`. The `max(..., 0)` clamp creates a non-zero derivative at the cutoff point — the glow abruptly disappears at `cosA=0.75`, producing a visible hard edge.

## Goal

Outer edge of atmosphere sphere dissipates to transparent. Inner edge (near globe surface) stays bright. No visible geometry boundary.

## Solution

Replace `rim` formula in both shader layers with exponential:

```glsl
float rim = 1.0 - exp(-cosA * k);
```

- At `cosA=0` (outer silhouette): `rim = 0` → fully transparent
- At `cosA≈0.85` (near globe surface): `rim ≈ 0.92` → bright
- No hard cutoff — smooth across the full range

`dirFactor` (directional bias toward top/left) is preserved unchanged.

## Changes

### Outer layer — `SphereGeometry(GLOBE_RADIUS * 1.1)`

```glsl
// before
float rim = pow(max(1.0 - cosA / 0.75, 0.0), 2.0);

// after
float rim = 1.0 - exp(-cosA * 3.0);
```

`alpha = rim * dirFactor * 0.9` — unchanged.

### Inner layer — `SphereGeometry(GLOBE_RADIUS * 1.04)`

```glsl
// before
float rim = pow(max(1.0 - cosA / 0.4, 0.0), 2.0);

// after
float rim = 1.0 - exp(-cosA * 4.5);
```

`alpha = rim * dirFactor * 1.5` — unchanged. Higher `k` (4.5 vs 3.0) keeps inner layer tighter.

## Non-changes

- Sphere radii (`1.1`, `1.04`) unchanged
- `BlendingMode`, `depthWrite`, `side: BackSide` unchanged
- `dirFactor` logic unchanged
- No new uniforms or geometry
