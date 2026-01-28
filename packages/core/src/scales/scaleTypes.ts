// packages/core/src/scales/scaleTypes.ts

/**
 * Shared types for scale wrappers.
 *
 * We keep these minimal to avoid coupling to a specific underlying scale library.
 */

export type Domain = [number, number];

export type PixelRange = [number, number];

export type ScaleFn<T> = (value: T) => number;

export type InvertibleScaleFn<T> = ScaleFn<T> & {
  invert: (px: number) => T;
};