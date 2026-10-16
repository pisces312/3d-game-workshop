// Single source of truth for every tunable constant in Space Fold.
// World constants never depend on the viewport (ADR-2): resize only touches rendering.

export const TAU = Math.PI * 2;

export const CONFIG = Object.freeze({
  // World geometry (world units)
  ORBIT_RADIUS: 3, // R: distance of the ball centre from the tunnel axis
  BALL_RADIUS: 0.34, // r: ball radius
  PLAYER_Z: 0, // judgement plane
  SPAWN_Z: -140, // obstacles appear here
  DESPAWN_Z: 8, // obstacles past this are recycled
  FIRST_OBSTACLE_Z: -45, // first obstacle of a run
  TUNNEL_RADIUS: 3.9, // visual tunnel wall radius
  OBSTACLE_TUBE: 0.32, // torus tube radius of an obstacle ring

  // Camera
  CAMERA_Z: 7,
  BASE_VFOV_DEG: 70,
  MIN_HFOV_DEG: 62,
  MAX_VFOV_DEG: 105,

  // Simulation timing
  SIM_STEP: 1 / 120,
  MAX_FRAME_DT: 0.1,
  MAX_STEPS_PER_FRAME: 12,

  // Controls
  KEY_ANGULAR_SPEED: 3.4, // rad/s while a direction key is held
  DRAG_GAIN: 4.2, // rad per short-side-of-viewport of drag

  // Geometry / collision sharing
  GAP_QUANT: 0.01, // gap sizes are quantised so mesh and rule share one value

  // Performance
  DPR_CAP: 1.5,
  DPR_LOW: 1.0,
  SLOW_FRAME_MS: 22,
  // (SPAWN_Z..DESPAWN_Z) = 148 units / min spacing 11 => up to 14 live obstacles,
  // so the pool holds 16 to never skip a spawn at top difficulty.
  MAX_OBSTACLES: 16,
  MAX_PARTICLES: 80,
  TRAIL_POINTS: 14,

  // Difficulty phases
  ROTATING_FROM_SCORE: 8,
  TWIST_FROM_SCORE: 15,

  // Player start angle: bottom of the tunnel
  INITIAL_THETA: -Math.PI / 2,
});
