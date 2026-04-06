// Generates public/world.png — equirectangular land mask (white=land, black=ocean)
// from Natural Earth 110m TopoJSON via world-atlas.
import { createCanvas } from 'canvas';
import { feature } from 'topojson-client';
import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load TopoJSON (110m = ~90KB, clean continent shapes)
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const topology = require('world-atlas/land-110m.json');

const W = 2048;
const H = 1024;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Black background = ocean
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, W, H);

// Equirectangular projection: lon [-180,180] → x, lat [90,-90] → y
const project = ([lon, lat]) => [
  ((lon + 180) / 360) * W,
  ((90 - lat) / 180) * H,
];

const land = feature(topology, topology.objects.land);

ctx.fillStyle = '#fff';

const geometries =
  land.type === 'FeatureCollection'
    ? land.features.map(f => f.geometry)
    : [land.geometry];

for (const geom of geometries) {
  if (!geom) continue;
  const rings =
    geom.type === 'Polygon'
      ? geom.coordinates
      : geom.type === 'MultiPolygon'
      ? geom.coordinates.flat()
      : [];

  for (const ring of rings) {
    ctx.beginPath();
    for (let i = 0; i < ring.length; i++) {
      const [px, py] = project(ring[i]);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        const dLon = Math.abs(ring[i][0] - ring[i - 1][0]);
        if (dLon > 180) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }
}

const outPath = join(__dirname, '../public/world.png');
const out = createWriteStream(outPath);
canvas.createPNGStream().pipe(out);
out.on('finish', () => {
  console.log(`Written: ${outPath} (${W}x${H})`);
});
