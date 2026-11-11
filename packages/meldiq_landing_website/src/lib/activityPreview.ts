export const ACTIVITY_PREVIEW_INTERVAL_MS = 3 * 60_000;

// A time-based simulation, shared across page loads. This is never live user data.
function sample(segment: number): number {
  let value = Math.imul(segment ^ 0x6d656c64, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
}

export function getActivityPreview(timestamp: number): number {
  const interval = Math.floor(timestamp / ACTIVITY_PREVIEW_INTERVAL_MS);
  // Alternating parity keeps consecutive intervals distinct while sampling 150–300.
  const parity = interval & 1;
  return 150 + parity + 2 * Math.floor(sample(interval) * (76 - parity));
}
