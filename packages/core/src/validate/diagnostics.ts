// packages/core/src/validate/diagnostics.ts

/**
 * Diagnostic system for validation and non-fatal warnings.
 *
 * Philosophy:
 * - Validation should be cheap and deterministic.
 * - We prefer returning diagnostics rather than throwing in most cases.
 * - The RN layer (or consumer) can decide whether to throw on errors.
 *
 * This design helps OSS contributors:
 * - clear error messages
 * - consistent failure modes
 * - easier debugging in example app
 */

export type DiagnosticLevel = "error" | "warn";

export type Diagnostic = {
  level: DiagnosticLevel;

  /**
   * Stable identifier for the diagnostic.
   * Use this for tests and for tooling that wants to suppress certain warnings.
   */
  code: string;

  /**
   * Human-friendly explanation.
   * Should describe the impact and what to do next.
   */
  message: string;

  /**
   * Optional path hint for where the problem occurred.
   * Example: "series[2].data[10].y"
   */
  path?: string;
};

export type Diagnostics = {
  ok: boolean;
  errors: Diagnostic[];
  warnings: Diagnostic[];
};

export function createDiagnostics(): Diagnostics {
  return { ok: true, errors: [], warnings: [] };
}

export function addError(d: Diagnostics, code: string, message: string, path?: string) {
  d.ok = false;
  d.errors.push({ level: "error", code, message, path });
}

export function addWarning(d: Diagnostics, code: string, message: string, path?: string) {
  d.warnings.push({ level: "warn", code, message, path });
}

/**
 * Utility for consistent numeric checks.
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}