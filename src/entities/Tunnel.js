// Procedural tunnel (rings + longitudinal lines) and a starfield (FR1, FR15).
// One LineSegments for the whole tunnel; scrolling only moves the group (zero allocation).
import * as THREE from 'three';
import { CONFIG, TAU } from '../config.js';
import { PALETTE } from '../theme.js';

const RING_COUNT = 24;
const RING_SEGMENTS = 48;
const RING_SPACING = 6;
const LONG_LINES = 16;
const STAR_COUNT = 400;

const BASE_COLOR = new THREE.Color(PALETTE.tunnel);
const TWIST_COLOR = new THREE.Color(PALETTE.twist);

function buildTunnelGeometry(config) {
  const R = config.TUNNEL_RADIUS;
  const zNear = 8;
  const zFar = zNear - RING_SPACING * (RING_COUNT - 1);
  const segs = RING_COUNT * RING_SEGMENTS + LONG_LINES;
  const pos = new Float32Array(segs * 2 * 3);
  let k = 0;
  const push = (x, y, z) => {
    pos[k++] = x;
    pos[k++] = y;
    pos[k++] = z;
  };
  for (let i = 0; i < RING_COUNT; i++) {
    const z = zNear - i * RING_SPACING;
    for (let s = 0; s < RING_SEGMENTS; s++) {
      const a0 = (s / RING_SEGMENTS) * TAU;
      const a1 = ((s + 1) / RING_SEGMENTS) * TAU;
      push(R * Math.cos(a0), R * Math.sin(a0), z);
      push(R * Math.cos(a1), R * Math.sin(a1), z);
    }
  }
  for (let l = 0; l < LONG_LINES; l++) {
    const a = (l / LONG_LINES) * TAU;
    push(R * Math.cos(a), R * Math.sin(a), zNear + RING_SPACING);
    push(R * Math.cos(a), R * Math.sin(a), zFar - RING_SPACING);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return geo;
}

function buildStarGeometry(rng = Math.random) {
  const pos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const a = rng() * TAU;
    const r = 20 + rng() * 40;
    pos[i * 3] = r * Math.cos(a);
    pos[i * 3 + 1] = r * Math.sin(a);
    pos[i * 3 + 2] = 10 - rng() * 220;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return geo;
}

// ---- glowing inner wall (FR24) -----------------------------------------------------------
const WALL_NEAR = 14;
const WALL_FAR = -150;
const WALL_LEN = WALL_NEAR - WALL_FAR;
const DUST_COUNT = 260;
const DUST_NEAR = 9;
const DUST_FAR = -150;

const WALL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const WALL_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uTwist;
  uniform float uSpeed;
  uniform vec3 uColor;
  uniform vec3 uTwistColor;
  varying vec2 vUv;
  void main() {
    float z = vUv.y * ${WALL_LEN.toFixed(1)};          // along the tunnel (world units)
    float a = vUv.x * 6.2831853;                        // around the tunnel
    // soft flowing bands that travel toward the camera
    float bands = 0.5 + 0.5 * sin((z - uScroll) * 0.55 + uTwist * a * 1.5);
    bands = pow(bands, 6.0);
    // faint hex/grid shimmer
    vec2 g = vec2(a * 4.0, (z - uScroll) * 0.6);
    vec2 h = abs(fract(g + vec2(0.5 * floor(g.y), 0.0)) - 0.5);
    float grid = smoothstep(0.46, 0.5, max(h.x, h.y));
    float shimmer = 0.5 + 0.5 * sin(uTime * 2.0 + z * 0.3 + a * 3.0);
    // fade far away and very close to the camera
    float fade = smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.93, 1.0, vUv.y));
    float speedK = clamp((uSpeed - 14.0) / 20.0, 0.0, 1.0);
    vec3 col = mix(uColor, uTwistColor, uTwist);
    float alpha = (bands * (0.16 + 0.12 * speedK) + grid * shimmer * 0.06) * fade;
    gl_FragColor = vec4(col * (0.8 + bands), alpha);
  }
`;

function buildDust(rng = Math.random) {
  const pos = new Float32Array(DUST_COUNT * 3);
  for (let i = 0; i < DUST_COUNT; i++) {
    const a = rng() * TAU;
    const r = 0.6 + rng() * 3.0;
    pos[i * 3] = r * Math.cos(a);
    pos[i * 3 + 1] = r * Math.sin(a);
    pos[i * 3 + 2] = DUST_FAR + rng() * (DUST_NEAR - DUST_FAR);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return geo;
}

export class Tunnel {
  constructor(config = CONFIG) {
    this.config = config;
    this.group = new THREE.Group();

    this.material = new THREE.LineBasicMaterial({
      color: BASE_COLOR.clone(),
      transparent: true,
      opacity: 0.55,
    });
    this.lines = new THREE.LineSegments(buildTunnelGeometry(config), this.material);
    this.lines.frustumCulled = false;
    this.group.add(this.lines);

    this.starMaterial = new THREE.PointsMaterial({
      color: 0xeef4ff,
      size: 0.45,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      fog: false,
      depthWrite: false,
    });
    this.stars = new THREE.Points(buildStarGeometry(), this.starMaterial);
    this.stars.frustumCulled = false;
    this.group.add(this.stars);

    this.wallUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uTwist: { value: 0 },
      uSpeed: { value: 14 },
      uColor: { value: new THREE.Color(PALETTE.blue) },
      uTwistColor: { value: TWIST_COLOR.clone() },
    };
    const wallGeo = new THREE.CylinderGeometry(
      config.TUNNEL_RADIUS + 0.05,
      config.TUNNEL_RADIUS + 0.05,
      WALL_LEN,
      48,
      1,
      true,
    );
    // Cylinder axis y -> tunnel axis z; uv.y = 1 at the near (camera) end.
    wallGeo.rotateX(Math.PI / 2);
    wallGeo.translate(0, 0, (WALL_NEAR + WALL_FAR) / 2);
    this.wallMaterial = new THREE.ShaderMaterial({
      uniforms: this.wallUniforms,
      vertexShader: WALL_VERT,
      fragmentShader: WALL_FRAG,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.wall = new THREE.Mesh(wallGeo, this.wallMaterial);
    this.wall.frustumCulled = false;
    this.wall.renderOrder = -1;
    this.group.add(this.wall);

    this.dustMaterial = new THREE.PointsMaterial({
      color: 0xcfe8ff,
      size: 0.07,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.dust = new THREE.Points(buildDust(), this.dustMaterial);
    this.dust.frustumCulled = false;
    this.group.add(this.dust);

    this._twistMix = 0;
    this._time = 0;
  }

  /**
   * @param {number} scroll world distance travelled (visual only)
   * @param {number} dt frame delta (s)
   * @param {boolean} twist whether the space-twist phase is active
   */
  update(scroll, dt, twist, speed = 14) {
    this.lines.position.z = scroll % RING_SPACING;
    this.stars.rotation.z += dt * 0.03;
    const target = twist ? 1 : 0;
    this._twistMix += (target - this._twistMix) * (1 - Math.exp(-2.5 * dt));
    this.material.color.copy(BASE_COLOR).lerp(TWIST_COLOR, this._twistMix);

    this._time += dt;
    const u = this.wallUniforms;
    u.uTime.value = this._time;
    u.uScroll.value = scroll;
    u.uTwist.value = this._twistMix;
    u.uSpeed.value = speed;

    // Space dust drifts toward the camera (in-place, zero allocation).
    if (dt > 0) {
      const p = this.dust.geometry.attributes.position;
      const arr = p.array;
      const dz = (6 + speed * 0.8) * dt;
      for (let i = 2; i < arr.length; i += 3) {
        arr[i] += dz;
        if (arr[i] > DUST_NEAR) arr[i] -= DUST_NEAR - DUST_FAR;
      }
      p.needsUpdate = true;
    }
  }
}
