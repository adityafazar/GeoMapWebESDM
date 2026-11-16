/**
 * Apple Designing Fluid Interfaces (WWDC 2018) — Web Physics & Gesture Primitives
 * Translated for 120Hz requestAnimationFrame DOM mutation without React re-renders.
 */

export interface AppleSpringConfig {
  /** Time in seconds for the spring to reach near-target (Apple response, default 0.36s). */
  response?: number;
  /** Damping ratio: 1.0 = critically damped (no overshoot), ~0.8 = slight momentum bounce. */
  dampingRatio?: number;
  /** Threshold at which the spring settles cleanly. */
  restDelta?: number;
}

export interface SpringState {
  value: number;
  velocity: number;
}

/**
 * Apple's exact exponential-decay momentum projection function.
 * Predicts where an object moving at `velocityPxPerSec` will naturally come to rest.
 */
export function projectMomentum(
  velocityPxPerSec: number,
  decelerationRate = 0.992,
): number {
  return ((velocityPxPerSec / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Progressive rubber-band boundary resistance (never stops like a brick wall).
 */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55,
): number {
  if (dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Clamp value inside [min, max] with soft rubber-band resistance outside bounds.
 */
export function rubberbandClamp(
  value: number,
  min: number,
  max: number,
  dimension: number,
  constant = 0.55,
): number {
  if (value < min) return min + rubberband(value - min, dimension, constant);
  if (value > max) return max + rubberband(value - max, dimension, constant);
  return value;
}

/**
 * Advances a spring toward `target` over `dt` seconds using semi-implicit sub-stepped integration
 * parameterized by Apple's (response, dampingRatio) pair.
 */
export function stepAppleSpring(
  state: SpringState,
  target: number,
  dtSec: number,
  config: AppleSpringConfig = {},
): { value: number; velocity: number; settled: boolean } {
  const response = Math.max(0.08, config.response ?? 0.36);
  const dampingRatio = Math.max(0.2, config.dampingRatio ?? 1.0);
  const restDelta = config.restDelta ?? 0.25;

  const omega = (2 * Math.PI) / response;
  const stiffness = omega * omega;
  const damping = 2 * dampingRatio * omega;

  // Sub-step for numerical stability even if a frame drops or runs at 120Hz
  const clampedDt = Math.min(dtSec, 0.064);
  const subSteps = Math.max(1, Math.ceil(clampedDt / 0.004));
  const h = clampedDt / subSteps;

  let x = state.value;
  let v = state.velocity;

  for (let i = 0; i < subSteps; i += 1) {
    const accel = -stiffness * (x - target) - damping * v;
    v += accel * h;
    x += v * h;
  }

  const settled =
    Math.abs(target - x) <= restDelta && Math.abs(v) <= restDelta * 6;

  if (settled) {
    return { value: target, velocity: 0, settled: true };
  }

  return { value: x, velocity: v, settled: false };
}

export interface VelocitySample {
  x: number;
  y: number;
  t: number;
}

/**
 * Tracks a short rolling window (~80ms) of pointer positions so release velocity
 * seamlessly hands off from 1:1 tracking into a velocity-seeded spring.
 */
export function createVelocityTracker(windowMs = 90) {
  let samples: VelocitySample[] = [];

  return {
    reset() {
      samples = [];
    },
    push(x: number, y: number, now = performance.now()) {
      samples.push({ x, y, t: now });
      const cutoff = now - windowMs;
      while (samples.length > 2 && samples[0].t < cutoff) {
        samples.shift();
      }
    },
    velocity(now = performance.now()): { vx: number; vy: number } {
      const cutoff = now - windowMs;
      const valid = samples.filter((s) => s.t >= cutoff);
      if (valid.length < 2) return { vx: 0, vy: 0 };
      const first = valid[0];
      const last = valid[valid.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt <= 0.004) return { vx: 0, vy: 0 };
      // Cap extreme spikes for comfortable desktop trackpad & mobile flicks
      const clampV = (val: number) => Math.max(-2400, Math.min(2400, val));
      return {
        vx: clampV((last.x - first.x) / dt),
        vy: clampV((last.y - first.y) / dt),
      };
    },
  };
}

