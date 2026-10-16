// Gapped ring meshes (FR1, FR14). The visual gap equals the collision gap exactly:
// TorusGeometry arc = 2π − gapSize, rotated so the arc starts at the gap's upper edge.
// Flat radial end caps only — nothing sticks out beyond the arc ends.
import * as THREE from 'three';
import { CONFIG, TAU } from '../config.js';
import { PALETTE } from '../theme.js';

export const OBSTACLE_COLORS = Object.freeze({ fixed: PALETTE.orange, rotating: PALETTE.blue });

export class ObstacleMeshes {
  constructor(config = CONFIG, capacity = config.MAX_OBSTACLES) {
    this.config = config;
    this.group = new THREE.Group();
    this.geometryCache = new Map();
    this.materials = {
      fixed: new THREE.MeshBasicMaterial({ color: OBSTACLE_COLORS.fixed }),
      rotating: new THREE.MeshBasicMaterial({ color: OBSTACLE_COLORS.rotating }),
    };
    this.meshes = [];
    for (let i = 0; i < capacity; i++) {
      const mesh = new THREE.Mesh(this.geometryFor(1.7), this.materials.fixed);
      mesh.visible = false;
      mesh.frustumCulled = false;
      this.meshes.push(mesh);
      this.group.add(mesh);
    }
  }

  /** Cached torus for a (quantised) gap size. */
  geometryFor(gapSize) {
    const key = Math.round(gapSize / this.config.GAP_QUANT);
    let geo = this.geometryCache.get(key);
    if (!geo) {
      const arc = TAU - key * this.config.GAP_QUANT;
      geo = new THREE.TorusGeometry(this.config.ORBIT_RADIUS, this.config.OBSTACLE_TUBE, 10, 72, arc);
      this.geometryCache.set(key, geo);
    }
    return geo;
  }

  /** Map active obstacles onto pooled meshes; hide the rest. */
  sync(obstacles) {
    const n = Math.min(obstacles.length, this.meshes.length);
    for (let i = 0; i < n; i++) {
      const o = obstacles[i];
      const mesh = this.meshes[i];
      mesh.geometry = this.geometryFor(o.gapSize);
      mesh.material = o.kind === 'rotating' ? this.materials.rotating : this.materials.fixed;
      mesh.position.set(0, 0, o.z);
      mesh.rotation.z = o.gapCenter + o.gapSize / 2;
      mesh.visible = true;
    }
    for (let i = n; i < this.meshes.length; i++) this.meshes[i].visible = false;
  }
}
