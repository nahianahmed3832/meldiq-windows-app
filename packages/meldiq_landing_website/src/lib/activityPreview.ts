const MINUTE_MS = 60_000;
const SEGMENT_MINUTES = 180;

// A time-based simulation, shared across page loads. This is never live user data.
function sample(segment: number): number {
  let value = Math.imul(segment ^ 0x6d656c64, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
}

export function getActivityPreview(timestamp: number): number {
  const minute = Math.floor(timestamp / MINUTE_MS);
  const segment = Math.floor(minute / SEGMENT_MINUTES);
  const progress = (minute - segment * SEGMENT_MINUTES) / SEGMENT_MINUTES;
  const blend = progress * progress * (3 - 2 * progress);
  const level = sample(segment) * (1 - blend) + sample(segment + 1) * blend;
  // Alternating parity changes the number every minute, even near a turning point.
  // Smooth interpolation limits adjacent minute changes to 17, within 200–1,999.
  return 200 + 2 * Math.round(level * 899) + (minute % 2);
}
