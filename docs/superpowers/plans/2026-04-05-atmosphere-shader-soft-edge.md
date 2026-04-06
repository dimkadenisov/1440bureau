# Atmosphere Shader Soft Edge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hard-cutoff rim formula in both atmosphere shader layers with exponential falloff so the outer edge fades to transparent.

**Architecture:** Two GLSL fragment shaders inside `addAtmosphere()` each get a one-line formula change. No new files, no new geometry, no new uniforms.

**Tech Stack:** Three.js ShaderMaterial, GLSL

---

### Task 1: Replace rim formula in outer atmosphere layer

**Files:**
- Modify: `src/components/globe/GlobeRenderer.ts:278`

- [ ] **Step 1: Replace the formula**

In `addAtmosphere()`, first `ShaderMaterial` fragmentShader (outer layer, `GLOBE_RADIUS * 1.1`):

```glsl
// Remove this line:
float rim = pow(max(1.0 - cosA / 0.75, 0.0), 2.0);

// Replace with:
float rim = 1.0 - exp(-cosA * 3.0);
```

The full updated fragmentShader block becomes:
```glsl
fragmentShader: `
  varying vec3 vNormal;
  void main() {
    float cosA = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    float rim = 1.0 - exp(-cosA * 3.0);

    float nBias = clamp( vNormal.y, 0.0, 1.0);
    float wBias = clamp(-vNormal.x, 0.0, 1.0);
    float dirFactor = mix(0.05, 1.0, nBias * 0.65 + wBias * 0.35);

    float alpha = rim * dirFactor * 0.9;
    gl_FragColor = vec4(0.35, 0.58, 1.0, alpha);
  }
`,
```

- [ ] **Step 2: Verify in browser**

Start dev server (`npm run dev`) and check globe — outer atmosphere should now fade to transparent at the edge instead of cutting off.

---

### Task 2: Replace rim formula in inner rim layer

**Files:**
- Modify: `src/components/globe/GlobeRenderer.ts:310`

- [ ] **Step 1: Replace the formula**

In `addAtmosphere()`, second `ShaderMaterial` fragmentShader (inner layer, `GLOBE_RADIUS * 1.04`):

```glsl
// Remove this line:
float rim = pow(max(1.0 - cosA / 0.4, 0.0), 2.0);

// Replace with:
float rim = 1.0 - exp(-cosA * 4.5);
```

The full updated fragmentShader block becomes:
```glsl
fragmentShader: `
  varying vec3 vNormal;
  void main() {
    float cosA = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    float rim = 1.0 - exp(-cosA * 4.5);

    float nBias = clamp( vNormal.y, 0.0, 1.0);
    float wBias = clamp(-vNormal.x, 0.0, 1.0);
    float dirFactor = mix(0.05, 1.0, nBias * 0.65 + wBias * 0.35);

    float alpha = rim * dirFactor * 1.5;
    gl_FragColor = vec4(0.5, 0.7, 1.0, alpha);
  }
`,
```

- [ ] **Step 2: Verify in browser**

Check that the inner bright rim also has no hard outer edge, and the combined two-layer effect looks as expected.

- [ ] **Step 3: Commit**

```bash
git add src/components/globe/GlobeRenderer.ts
git commit -m "fix: atmosphere shaders — exponential falloff, outer edge fades to transparent"
```
