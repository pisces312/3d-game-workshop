// "Bolt 小橙": an original procedural mascot (FR20). Not based on any official logo or mascot.
// Body radius equals BALL_RADIUS and every decoration stays within |x| ≤ BALL_RADIUS in the
// local frame, so the visual width matches the collision width.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { PALETTE } from '../theme.js';

const EYE_R = 0.075;
const PUPIL_R = 0.035;
const EYE_X = 0.11;
const EYE_Y = 0.06;
const ANTENNA_R = 0.025;
const ANTENNA_LEN = 0.22;
const TIP_R = 0.06;
const GLOW_SCALE = 1.7;

/** Max |x| of the non-glow decoration in the mascot's local frame (pure; for tests). */
export function mascotHorizontalExtent() {
  return Math.max(EYE_X + EYE_R, ANTENNA_R, TIP_R);
}

export class Mascot {
  constructor(config = CONFIG) {
    const r = config.BALL_RADIUS;
    this.radius = r;
    this.group = new THREE.Group();

    this.body = new THREE.Mesh(
      new THREE.SphereGeometry(r, 24, 16),
      new THREE.MeshBasicMaterial({ color: PALETTE.orange }),
    );
    this.body.name = 'body';

    this.glow = new THREE.Mesh(
      new THREE.SphereGeometry(r, 16, 12),
      new THREE.MeshBasicMaterial({
        color: PALETTE.orangeLight,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.glow.name = 'glow';
    this.glow.scale.setScalar(GLOW_SCALE);

    const eyeGeo = new THREE.SphereGeometry(EYE_R, 12, 8);
    const pupilGeo = new THREE.SphereGeometry(PUPIL_R, 10, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: PALETTE.white });
    const pupilMat = new THREE.MeshBasicMaterial({ color: PALETTE.ink });
    // Eye centres sit just inside the camera-facing (+z) surface of the body.
    const eyeZ = Math.sqrt(Math.max(0, r * r - EYE_X * EYE_X - EYE_Y * EYE_Y)) - EYE_R * 0.35;
    this.eyes = [];
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.name = 'eye';
      eye.position.set(sx * EYE_X, EYE_Y, eyeZ);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.name = 'pupil';
      pupil.position.set(0, 0, EYE_R - PUPIL_R * 0.5);
      eye.add(pupil);
      this.eyes.push(eye);
    }

    this.antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(ANTENNA_R, ANTENNA_R, ANTENNA_LEN, 8),
      new THREE.MeshBasicMaterial({ color: PALETTE.ink }),
    );
    this.antenna.name = 'antenna';
    this.antenna.position.set(0, r + ANTENNA_LEN / 2 - 0.04, 0);

    this.tip = new THREE.Mesh(
      new THREE.SphereGeometry(TIP_R, 12, 8),
      new THREE.MeshBasicMaterial({ color: PALETTE.blue }),
    );
    this.tip.name = 'tip';
    this.tip.position.set(0, r + ANTENNA_LEN - 0.04, 0);

    this.group.add(this.body, this.glow, ...this.eyes, this.antenna, this.tip);
  }

  /** Position + upright roll (same roll as the camera). Allocation-free. */
  update(pos, theta, time = 0) {
    this.group.position.set(pos.x, pos.y, pos.z);
    this.group.rotation.z = theta + Math.PI / 2;
    this.glow.scale.setScalar(GLOW_SCALE + 0.1 * Math.sin(time * 8));
    this.tip.scale.setScalar(1 + 0.25 * Math.sin(time * 6));
    // Blink: squash the eyes vertically for ~0.12 s every 3 s.
    const blink = time % 3 < 0.12 ? 0.15 : 1;
    this.eyes[0].scale.y = blink;
    this.eyes[1].scale.y = blink;
  }
}
