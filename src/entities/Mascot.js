// "幽灵巫师 Boo": an original procedural mascot (FR20, revised in iteration 3 at the user's
// request) — a white ghost wearing a purple witch hat with a gold buckle, moon and stars.
// Built entirely from Three.js primitives; no image assets. The body sphere radius equals
// BALL_RADIUS and every decoration stays within |x| ≤ BALL_RADIUS in the local frame
// (x = tangential / screen-horizontal), so the visual width matches the collision width.
// The hat brim is therefore narrower than in the reference drawing on purpose.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { PALETTE } from '../theme.js';

// Cool off-white: luminance just above the Bloom threshold (0.62) so the ghost gets a soft
// glow on desktop instead of blowing out to a featureless white blob.
const GHOST_WHITE = 0xb3bbd4;
const HAT_PURPLE = 0x3d2178;
const BAND_PURPLE = 0x6e4bd8;
const GOLD = 0xffc93c;
const EYE_BLACK = 0x111111;

const EYE_R = 0.068; // eye sphere radius before vertical stretch (readable at gameplay distance)
const EYE_X = 0.115;
const EYE_Y = 0.0;
const HEM_R = 0.12; // wavy hem bumps
const HEM_X = 0.2;
const BRIM_R = 0.33; // ≤ BALL_RADIUS so the hat never looks wider than the hitbox
const CONE_R = 0.19;
const CONE_H = 0.4;
const TIP_X = 0.13; // bent tip leans toward +x
const TIP_R = 0.07;
const GLOW_SCALE = 1.7;

/** Max |x| of the non-glow decoration in the mascot's local frame (pure; for tests). */
export function mascotHorizontalExtent() {
  return Math.max(EYE_X + EYE_R, HEM_X + HEM_R, BRIM_R, CONE_R, TIP_X + TIP_R);
}

function basic(color, extra = {}) {
  return new THREE.MeshBasicMaterial({ color, ...extra });
}

export class Mascot {
  constructor(config = CONFIG) {
    const r = config.BALL_RADIUS;
    this.radius = r;
    this.group = new THREE.Group();

    // Head dome = the collision body.
    this.body = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), basic(GHOST_WHITE));
    this.body.name = 'body';

    // Ghost skirt below the head (radially outward, toward the tunnel wall) + wavy hem.
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.97, 0.26, 20, 1, true), basic(GHOST_WHITE, { side: THREE.DoubleSide }));
    skirt.name = 'skirt';
    skirt.position.set(0, -0.13, 0);
    const hemGeo = new THREE.SphereGeometry(HEM_R, 12, 8);
    const hemMat = basic(GHOST_WHITE);
    this.hem = [-1, 0, 1].map((k) => {
      const m = new THREE.Mesh(hemGeo, hemMat);
      m.name = 'hem';
      m.position.set(k * HEM_X, -0.27 - (k === 0 ? 0.03 : 0), 0);
      return m;
    });

    // Orange AWS-style halo (excluded from the width rule; it is light, not body).
    this.glow = new THREE.Mesh(
      new THREE.SphereGeometry(r, 16, 12),
      basic(PALETTE.orangeLight, {
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.glow.name = 'glow';
    this.glow.scale.setScalar(GLOW_SCALE);

    // Oval black eyes on the camera-facing (+z) side.
    const eyeGeo = new THREE.SphereGeometry(EYE_R, 12, 8);
    const eyeMat = basic(EYE_BLACK);
    const eyeZ = Math.sqrt(Math.max(0, r * r - EYE_X * EYE_X - EYE_Y * EYE_Y)) - EYE_R * 0.3;
    this.eyes = [-1, 1].map((sx) => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.name = 'eye';
      eye.position.set(sx * EYE_X, EYE_Y, eyeZ);
      eye.scale.set(1, 1.5, 0.6);
      return eye;
    });

    // Witch hat (points toward the tunnel axis = screen up).
    this.hat = new THREE.Group();
    this.hat.name = 'hat';
    this.hat.position.set(0, r * 0.8, 0);
    this.hat.rotation.z = -0.12; // jaunty tilt
    const hatMat = basic(HAT_PURPLE);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(BRIM_R, BRIM_R, 0.035, 28), hatMat);
    brim.name = 'brim';
    const cone = new THREE.Mesh(new THREE.ConeGeometry(CONE_R, CONE_H, 24), hatMat);
    cone.name = 'cone';
    cone.position.set(0, CONE_H / 2, 0);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(TIP_R, 0.2, 12), hatMat);
    tip.name = 'hat-tip';
    tip.position.set(TIP_X * 0.6, CONE_H - 0.02, 0);
    tip.rotation.z = -1.0;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(CONE_R * 0.93, CONE_R, 0.06, 24), basic(BAND_PURPLE));
    band.name = 'band';
    band.position.set(0, 0.05, 0);
    const goldMat = basic(GOLD);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.055, 0.02), goldMat);
    buckle.name = 'buckle';
    buckle.position.set(0, 0.05, CONE_R - 0.005);
    const moon = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 6, 16, Math.PI * 1.3), goldMat);
    moon.name = 'moon';
    moon.position.set(-0.01, 0.2, CONE_R * 0.52);
    moon.rotation.z = 2.2;
    const starGeo = new THREE.OctahedronGeometry(0.022);
    const stars = [
      [0.06, 0.13],
      [-0.07, 0.11],
      [0.035, 0.28],
    ].map(([x, y]) => {
      const s = new THREE.Mesh(starGeo, goldMat);
      s.name = 'star';
      // place on the cone's front surface: radius at height y
      const surf = CONE_R * (1 - y / CONE_H);
      s.position.set(x, y, Math.sqrt(Math.max(0, surf * surf - x * x)) + 0.005);
      return s;
    });
    this.hat.add(brim, cone, tip, band, buckle, moon, ...stars);

    this.group.add(this.body, skirt, ...this.hem, this.glow, ...this.eyes, this.hat);
  }

  /** Position + upright roll (same roll as the camera). Allocation-free. */
  update(pos, theta, time = 0) {
    this.group.position.set(pos.x, pos.y, pos.z);
    this.group.rotation.z = theta + Math.PI / 2;
    this.glow.scale.setScalar(GLOW_SCALE + 0.1 * Math.sin(time * 8));
    // Ghostly hem ripple and a little hat bob.
    for (let i = 0; i < this.hem.length; i++) {
      this.hem[i].position.z = 0.02 * Math.sin(time * 7 + i * 1.7);
    }
    this.hat.rotation.z = -0.12 + 0.05 * Math.sin(time * 3);
    // Blink: squash the eyes vertically for ~0.12 s every 3 s.
    const blink = time % 3 < 0.12 ? 0.15 : 1.5;
    this.eyes[0].scale.y = blink;
    this.eyes[1].scale.y = blink;
  }
}
