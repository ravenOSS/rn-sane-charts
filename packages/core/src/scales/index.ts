// packages/core/src/scales/index.ts

/**
 * Scales module public surface.
 *
 * We use *small d3 modules* for scale math only.
 * This wrapper layer:
 * - keeps d3 usage centralized
 * - makes it easier to replace/extend later
 * - provides a stable internal API for core consumers
 *
 * IMPORTANT:
 * - Do not re-export the full d3 objects unless necessary.
 * - Prefer minimal wrapper functions with documented behavior.
 */

export * from "./scaleTypes";
export * from "./linear";
export * from "./time";
export * from "./band";
export * from "./ticks";