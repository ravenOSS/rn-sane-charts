// packages/core/src/model/types.ts

/**
 * Canonical shared types for rn-sane-charts core.
 *
 * Keep these types stable and minimal:
 * - They form the contract between "core" and renderer integrations.
 * - Public RN props can wrap these with friendlier UX later.
 */

export type XValue = number | Date;
export type YValue = number;

export type Datum = {
  x: XValue;
  y: YValue;
  [key: string]: any;
};

export type Series = {
  id: string;
  data: Datum[];
};

export type ChartPadding = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

export type ChartSize = {
  width: number;
  height: number;
};

export type DomainNumber = [number, number];
export type DomainDate = [Date, Date];

export type ScaleType = "linear" | "time" | "band";

/**
 * The output "geometry" types are intentionally simple.
 * Renderer packages can map these into Skia primitives.
 */
export type Point = {
  x: number;
  y: number;
};

export type LinePath = {
  /**
   * SVG-style path string (e.g. "M0,10 L20,30 ...").
   *
   * Why:
   * - Skia can consume SVG path strings.
   * - This keeps core renderer-agnostic.
   */
  d: string;
};

export type Tick = {
  value: unknown;
  label: string;
  x: number;
};

export type YTick = {
  value: number;
  label: string;
  y: number;
};