export type RectLike = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Inclusive point-in-rect check in screen space.
 *
 * Used by bar/legend/tool overlays to resolve tap targets deterministically.
 */
export function isPointInRect(
  x: number,
  y: number,
  rect: RectLike
): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}
