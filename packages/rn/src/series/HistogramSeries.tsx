import { Rect } from '@shopify/react-native-skia';
import { useChartContext } from '../context';

type HistogramDrawableBin = {
  x0: number | Date;
  x1: number | Date;
  count: number;
};

export type HistogramSeriesProps = {
  bins: HistogramDrawableBin[];
  color?: string;
  opacity?: number;
  gapPx?: number;
  baselineY?: number;
};

/**
 * Draw histogram bars from precomputed bins.
 *
 * Why bins are an explicit input:
 * - Binning policy is domain math and belongs in core/app transforms.
 * - Renderer should focus on deterministic drawing from already-shaped data.
 */
export function HistogramSeries(props: HistogramSeriesProps) {
  const { scales, theme } = useChartContext();
  const color = props.color ?? theme.series.palette[0];
  const opacity = clampOpacity(props.opacity ?? 0.9);
  const gapPx = Math.max(0, props.gapPx ?? 2);
  const y0 = scales.y(props.baselineY ?? 0);

  return (
    <>
      {props.bins.map((bin, index) => {
        const x0 = scales.x(bin.x0);
        const x1 = scales.x(bin.x1);
        const y = scales.y(bin.count);
        if (
          !Number.isFinite(x0) ||
          !Number.isFinite(x1) ||
          !Number.isFinite(y) ||
          !Number.isFinite(y0)
        ) {
          return null;
        }

        const left = Math.min(x0, x1) + gapPx / 2;
        const right = Math.max(x0, x1) - gapPx / 2;
        const width = Math.max(1, right - left);
        const rectY = Math.min(y0, y);
        const rectH = Math.max(1, Math.abs(y0 - y));

        return (
          <Rect
            key={`hist-${index}-${bin.x0}-${bin.x1}`}
            x={left}
            y={rectY}
            width={width}
            height={rectH}
            color={color}
            opacity={opacity}
          />
        );
      })}
    </>
  );
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 1;
  return Math.max(0, Math.min(1, opacity));
}
