export interface Bounds { x: number; y: number; width: number; height: number }
export interface SavedWindow { bounds: Bounds; maximized: boolean }
const finiteBounds = (b: Bounds) => b && [b.x, b.y, b.width, b.height].every(Number.isFinite) && b.width > 0 && b.height > 0;
/** Electron coordinates are device-independent pixels; clamp against the selected monitor's work area. */
export function restoreWindow(raw: unknown, workAreas: Bounds[]): SavedWindow {
  if (!workAreas.length || workAreas.some(b => !finiteBounds(b))) throw new Error('No usable display');
  const saved = raw as Partial<SavedWindow & Bounds> | null;
  const candidate = saved?.bounds ?? saved as Bounds;
  let area = workAreas[0];
  if (finiteBounds(candidate)) {
    const intersection = (d: Bounds) => Math.max(0, Math.min(candidate.x + candidate.width, d.x + d.width) - Math.max(candidate.x, d.x)) * Math.max(0, Math.min(candidate.y + candidate.height, d.y + d.height) - Math.max(candidate.y, d.y));
    area = workAreas.reduce((best, d) => intersection(d) > intersection(best) ? d : best, area);
  }
  const width = Math.min(area.width, Math.max(Math.min(960, area.width), finiteBounds(candidate) ? candidate.width : 1320));
  const height = Math.min(area.height, Math.max(Math.min(600, area.height), finiteBounds(candidate) ? candidate.height : 860));
  const x = finiteBounds(candidate) ? Math.max(area.x, Math.min(candidate.x, area.x + area.width - width)) : area.x + (area.width - width) / 2;
  const y = finiteBounds(candidate) ? Math.max(area.y, Math.min(candidate.y, area.y + area.height - height)) : area.y + (area.height - height) / 2;
  return { bounds: { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) }, maximized: saved?.maximized === true };
}
