// Gapped ring meshes (FR1, FR14, FR25). The visual gap equals the collision gap exactly:
// every ring (main + highlight) is a TorusGeometry arc = 2π − gapSize, rotated so the arc
// starts at the gap's upper edge. No end caps — nothing sticks out beyond the arc ends.
// Depth comes from a procedural matcap (no lights, no shadows) plus a thin additive rim.
import * as THREE from 'three';
import { CONFIG, TAU } from '../config.js';
import { PALETTE } from '../theme.js';

export const OBSTACLE_COLORS = Object.freeze({ fixed: PALETTE.orange, rotating: PALETTE.blue });

/** Main ring tube radius: thicker than v2 but well inside the tunnel wall (3 + 0.42 < 3.9). */
export const MAIN_TUBE = 0.42;
/** Highlight ring tube radius (same arc, drawn just in front of the main ring). */
export const HIGHLIGHT_TUBE = 0.1;
const HIGHLIGHT_Z = 0.34;

/** Small procedural matcap: lit sphere look without any scene light. */
function makeMatcap(hex, size = 64) {
  const base = new THREE.Color(hex);
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / (size - 1)) * 2 - 1;
      const ny = (y / (size - 1)) * 2 - 1;
      const r2 = nx * nx + ny * ny;
      const nz = Math.sqrt(Math.max(0, 1 - r2));
      // light from top-left-front
      const lambert = Math.max(0, nx * -0.35 + ny * 0.55 + nz * 0.76);
      const spec = Math.pow(lambert, 24) * 0.8;
      const rim = Math.pow(Math.min(1, r2), 3) * 0.35;
      const k = 0.32 + 0.68 * lambert;
      const i = (y * size + x) * 4;
      data[i] = Math.min(255, (base.r * k + spec + rim * base.r) * 255);
      data[i + 1] = Math.min(255, (base.g * k + spec + rim * base.g) * 255);
      data[i + 2] = Math.min(255, (base.b * k + spec + rim * base.b) * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export class ObstacleMeshes {
  constructor(config = CONFIG, capacity = config.MAX_OBSTACLES) {
    this.config = config;
    this.group = new THREE.Group();
    this.geometryCache = new Map();
    this.highlightCache = new Map();
    this.materials = {
      fixed: new THREE.MeshMatcapMaterial({ matcap: makeMatcap(OBSTACLE_COLORS.fixed) }),
      rotating: new THREE.MeshMatcapMaterial({ matcap: makeMatcap(OBSTACLE_COLORS.rotating) }),
    };
    const hl = (hex) =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(hex).lerp(new THREE.Color(PALETTE.white), 0.55),
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
    this.highlightMaterials = { fixed: hl(OBSTACLE_COLORS.fixed), rotating: hl(OBSTACLE_COLORS.rotating) };
    this.meshes = [];
    this.highlights = [];
    for (let i = 0; i < capacity; i++) {
      const mesh = new THREE.Mesh(this.geometryFor(1.7), this.materials.fixed);
      mesh.visible = false;
      mesh.frustumCulled = false;
      const hlMesh = new THREE.Mesh(this.highlightGeometryFor(1.7), this.highlightMaterials.fixed);
      hlMesh.visible = false;
      hlMesh.frustumCulled = false;
      this.meshes.push(mesh);
      this.highlights.push(hlMesh);
      this.group.add(mesh, hlMesh);
    }
  }

  _cached(cache, gapSize, tube, tubular) {
    const key = Math.round(gapSize / this.config.GAP_QUANT);
    let geo = cache.get(key);
    if (!geo) {
      const arc = TAU - key * this.config.GAP_QUANT;
      geo = new THREE.TorusGeometry(this.config.ORBIT_RADIUS, tube, tubular, 72, arc);
      cache.set(key, geo);
    }
    return geo;
  }

  /** Cached main torus for a (quantised) gap size. */
  geometryFor(gapSize) {
    return this._cached(this.geometryCache, gapSize, MAIN_TUBE, 14);
  }

  /** Cached thin highlight torus with the identical arc. */
  highlightGeometryFor(gapSize) {
    return this._cached(this.highlightCache, gapSize, HIGHLIGHT_TUBE, 6);
  }

  /** Map active obstacles onto pooled meshes; hide the rest. */
  sync(obstacles) {
    const n = Math.min(obstacles.length, this.meshes.length);
    for (let i = 0; i < n; i++) {
      const o = obstacles[i];
      const kind = o.kind === 'rotating' ? 'rotating' : 'fixed';
      const rot = o.gapCenter + o.gapSize / 2;
      const mesh = this.meshes[i];
      mesh.geometry = this.geometryFor(o.gapSize);
      mesh.material = this.materials[kind];
      mesh.position.set(0, 0, o.z);
      mesh.rotation.z = rot;
      mesh.visible = true;
      const h = this.highlights[i];
      h.geometry = this.highlightGeometryFor(o.gapSize);
      h.material = this.highlightMaterials[kind];
      h.position.set(0, 0, o.z + HIGHLIGHT_Z);
      h.rotation.z = rot;
      h.visible = true;
    }
    for (let i = n; i < this.meshes.length; i++) {
      this.meshes[i].visible = false;
      this.highlights[i].visible = false;
    }
  }
}
