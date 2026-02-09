import React from 'react';
import { Circle, Group, Line, Path, Rect, Skia } from '@shopify/react-native-skia';

export type MarkerSymbol = 'circle' | 'plus' | 'cross' | 'square' | 'diamond' | 'triangle';

export type MarkerStyle = {
  symbol?: MarkerSymbol;
  size?: number;
  color: string;
  opacity?: number;
  strokeWidth?: number;
  filled?: boolean;
};

type MarkerGlyphProps = MarkerStyle & {
  x: number;
  y: number;
};

/**
 * Draw a point marker glyph at chart coordinates.
 *
 * Why this helper exists:
 * - Keeps symbol rendering consistent across line/area/scatter series.
 * - Centralizes marker semantics so future symbols can be added once.
 *
 * Invariants:
 * - `size` is treated as full visual diameter/extent (not radius).
 * - Stroke-only symbols (`plus`, `cross`) ignore `filled`.
 */
export function MarkerGlyph(props: MarkerGlyphProps) {
  const symbol = props.symbol ?? 'circle';
  const size = Number.isFinite(props.size) ? Math.max(2, props.size ?? 8) : 8;
  const half = size / 2;
  const opacity = clampOpacity(props.opacity ?? 1);
  const strokeWidth = Number.isFinite(props.strokeWidth)
    ? Math.max(1, props.strokeWidth ?? 1.5)
    : 1.5;

  if (symbol === 'circle') {
    return (
      <Circle
        cx={props.x}
        cy={props.y}
        r={half}
        color={props.color}
        opacity={opacity}
      />
    );
  }

  if (symbol === 'plus') {
    return (
      <>
        <Line
          p1={{ x: props.x - half, y: props.y }}
          p2={{ x: props.x + half, y: props.y }}
          color={props.color}
          opacity={opacity}
          strokeWidth={strokeWidth}
        />
        <Line
          p1={{ x: props.x, y: props.y - half }}
          p2={{ x: props.x, y: props.y + half }}
          color={props.color}
          opacity={opacity}
          strokeWidth={strokeWidth}
        />
      </>
    );
  }

  if (symbol === 'cross') {
    return (
      <>
        <Line
          p1={{ x: props.x - half, y: props.y - half }}
          p2={{ x: props.x + half, y: props.y + half }}
          color={props.color}
          opacity={opacity}
          strokeWidth={strokeWidth}
        />
        <Line
          p1={{ x: props.x - half, y: props.y + half }}
          p2={{ x: props.x + half, y: props.y - half }}
          color={props.color}
          opacity={opacity}
          strokeWidth={strokeWidth}
        />
      </>
    );
  }

  if (symbol === 'square') {
    const x = props.x - half;
    const y = props.y - half;
    if (props.filled ?? true) {
      return (
        <Rect
          x={x}
          y={y}
          width={size}
          height={size}
          color={props.color}
          opacity={opacity}
        />
      );
    }

    return (
      <Rect
        x={x}
        y={y}
        width={size}
        height={size}
        color={props.color}
        opacity={opacity}
        style="stroke"
        strokeWidth={strokeWidth}
      />
    );
  }

  const diamondPath = React.useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(props.x, props.y - half);
    p.lineTo(props.x + half, props.y);
    p.lineTo(props.x, props.y + half);
    p.lineTo(props.x - half, props.y);
    p.close();
    return p;
  }, [props.x, props.y, half]);

  if (symbol === 'diamond') {
    return props.filled ?? true ? (
      <Path path={diamondPath} color={props.color} opacity={opacity} />
    ) : (
      <Path
        path={diamondPath}
        color={props.color}
        opacity={opacity}
        style="stroke"
        strokeWidth={strokeWidth}
      />
    );
  }

  const trianglePath = React.useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(props.x, props.y - half);
    p.lineTo(props.x + half, props.y + half);
    p.lineTo(props.x - half, props.y + half);
    p.close();
    return p;
  }, [props.x, props.y, half]);

  return props.filled ?? true ? (
    <Path path={trianglePath} color={props.color} opacity={opacity} />
  ) : (
    <Group>
      <Path
        path={trianglePath}
        color={props.color}
        opacity={opacity}
        style="stroke"
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.max(0, Math.min(1, opacity));
}
