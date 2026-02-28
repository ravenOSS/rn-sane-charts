import { describe, expect, it } from 'vitest';
import type { Datum } from '@rn-sane-charts/core';
import { resolveVerticalBarDataLabel } from './dataLabels';

const datum: Datum = { x: new Date('2026-01-01T00:00:00.000Z'), y: 42 };

const measureText = ({
  text,
  font,
}: {
  text: string;
  font: { size: number };
}) => ({
  width: text.length * font.size * 0.58,
  height: font.size,
});

describe('bar data labels', () => {
  it('returns null when position is none', () => {
    const label = resolveVerticalBarDataLabel({
      dataLabels: { position: 'none' },
      value: 42,
      datum,
      seriesId: 'Revenue',
      rect: { x: 20, y: 40, width: 24, height: 60 },
      outsideDirection: 'up',
      fillColor: '#3B82F6',
      defaultTextColor: '#111827',
      plot: { x: 0, y: 0, width: 320, height: 200 },
      measureText,
      baseFont: { size: 12, family: 'System' },
    });

    expect(label).toBeNull();
  });

  it('places outside labels above positive bars', () => {
    const label = resolveVerticalBarDataLabel({
      dataLabels: { position: 'outside' },
      value: 42,
      datum,
      seriesId: 'Revenue',
      rect: { x: 80, y: 64, width: 28, height: 72 },
      outsideDirection: 'up',
      fillColor: '#3B82F6',
      defaultTextColor: '#111827',
      plot: { x: 0, y: 0, width: 320, height: 220 },
      measureText,
      baseFont: { size: 12, family: 'System' },
    });

    expect(label).not.toBeNull();
    expect(label!.baselineY).toBeLessThan(64);
    expect(label!.text).toBe('42');
  });

  it('uses smaller font size when bar width is constrained', () => {
    const label = resolveVerticalBarDataLabel({
      dataLabels: { position: 'inside', maxFontSize: 16, minFontSize: 8 },
      value: 123,
      datum,
      seriesId: 'Revenue',
      rect: { x: 120, y: 50, width: 24, height: 80 },
      outsideDirection: 'up',
      fillColor: '#3B82F6',
      defaultTextColor: '#111827',
      plot: { x: 0, y: 0, width: 320, height: 220 },
      measureText,
      baseFont: { size: 12, family: 'System' },
    });

    expect(label).toBeDefined();
    expect(label?.font.size).toBeLessThan(16);
    expect(label?.font.size).toBeGreaterThanOrEqual(8);
  });

  it('keeps inside labels visible for short bars when minimum size fits', () => {
    const label = resolveVerticalBarDataLabel({
      dataLabels: { position: 'inside', maxFontSize: 12, minFontSize: 10 },
      value: 42,
      datum,
      seriesId: 'Revenue',
      rect: { x: 40, y: 40, width: 30, height: 12 },
      outsideDirection: 'up',
      fillColor: '#3B82F6',
      defaultTextColor: '#111827',
      plot: { x: 0, y: 0, width: 320, height: 220 },
      measureText,
      baseFont: { size: 12, family: 'System' },
    });

    expect(label).not.toBeNull();
    expect(label!.font.size).toBe(10);
  });
});
