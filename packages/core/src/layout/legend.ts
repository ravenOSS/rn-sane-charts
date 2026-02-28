import type { FontSpec, MeasureTextFn } from "./measureTextTypes";
import type { LayoutResult } from "./layoutTypes";

export type LegendPositionPreference = "auto" | "right" | "bottom";
export type LegendPosition = "right" | "bottom";
export type LegendOrientation = "vertical" | "horizontal";

export type LegendItem = {
  id: string;
  label: string;
  color: string;
};

export type LegendMeasuredItem = LegendItem & {
  textWidth: number;
  textHeight: number;
  rowWidth: number;
};

export type LegendSizingOptions = {
  swatchSizePx?: number;
  swatchTextGapPx?: number;
  itemGapPx?: number;
  paddingPx?: number;
  outerMarginPx?: number;
  rightReserveGapPx?: number;
  bottomReserveGapPx?: number;
  rightPlacementMinChartWidthPx?: number;
  rightPlacementMaxWidthRatio?: number;
  rightPlacementMinPlotWidthPx?: number;
};

export type LegendLayoutResult = {
  show: boolean;
  items: LegendMeasuredItem[];
  position: LegendPosition;
  orientation: LegendOrientation;
  width: number;
  height: number;
  rowHeight: number;
  reservedRight: number;
  reservedBottom: number;
  metrics: Required<LegendSizingOptions>;
};

export type LegendItemBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Resolve legend placement/orientation and reserved chart padding.
 *
 * Why this belongs in core:
 * - Placement is layout policy, not renderer behavior.
 * - Keeping it pure makes "legend never covers plot" testable and deterministic.
 */
export function computeLegendLayout(input: {
  chartWidth: number;
  items: LegendItem[];
  measureText: MeasureTextFn;
  font: FontSpec;
  show?: boolean;
  position?: LegendPositionPreference;
  metrics?: LegendSizingOptions;
}): LegendLayoutResult {
  const metrics = withLegendMetricDefaults(input.metrics);
  const explicitShow = input.show;
  const show = explicitShow ?? input.items.length > 1;

  if (!show || input.items.length === 0) {
    return {
      show: false,
      items: [],
      position: "bottom",
      orientation: "vertical",
      width: 0,
      height: 0,
      rowHeight: metrics.swatchSizePx,
      reservedRight: 0,
      reservedBottom: 0,
      metrics,
    };
  }

  const measured = measureLegendItems({
    items: input.items,
    measureText: input.measureText,
    font: input.font,
    metrics,
  });
  const explicitPosition = input.position ?? "auto";
  const position =
    explicitPosition === "auto"
      ? resolveLegendPosition({
          chartWidth: input.chartWidth,
          legendWidth: measured.verticalWidth,
          metrics,
        })
      : explicitPosition;

  const availableBottomWidth = Math.max(0, input.chartWidth - 24);
  const orientation: LegendOrientation =
    position === "bottom" && measured.horizontalWidth <= availableBottomWidth
      ? "horizontal"
      : "vertical";

  const width =
    orientation === "horizontal"
      ? measured.horizontalWidth
      : measured.verticalWidth;
  const height =
    orientation === "horizontal"
      ? measured.horizontalHeight
      : measured.verticalHeight;

  const reservedRight =
    position === "right" ? measured.verticalWidth + metrics.rightReserveGapPx : 0;
  const reservedBottom =
    position === "bottom" ? height + metrics.bottomReserveGapPx : 0;

  return {
    show: true,
    items: measured.items,
    position,
    orientation,
    width,
    height,
    rowHeight: measured.rowHeight,
    reservedRight,
    reservedBottom,
    metrics,
  };
}

/**
 * Compute per-item hit boxes using resolved legend layout.
 *
 * Why this is core logic:
 * - Hit regions depend on deterministic layout geometry and policy constants.
 * - Keeping this function pure allows renderer and tests to share exact behavior.
 */
export function computeLegendItemBoxes(input: {
  chartWidth: number;
  chartHeight: number;
  layout: LayoutResult;
  legend: Pick<
    LegendLayoutResult,
    | "show"
    | "items"
    | "position"
    | "orientation"
    | "width"
    | "height"
    | "rowHeight"
    | "metrics"
  >;
}): LegendItemBox[] {
  if (!input.legend.show || input.legend.items.length === 0) return [];

  const rowHeight = input.legend.rowHeight;
  const startX =
    input.legend.position === "right"
      ? input.chartWidth -
        input.legend.width -
        input.legend.metrics.outerMarginPx -
        2
      : input.layout.header.x +
        Math.max(0, (input.layout.header.width - input.legend.width) / 2);
  const startY =
    input.legend.position === "right"
      ? input.layout.plot.y + input.legend.metrics.outerMarginPx
      : input.chartHeight - input.legend.height - input.legend.metrics.outerMarginPx;

  return input.legend.items.map((item, index) => {
    const topY =
      input.legend.orientation === "horizontal"
        ? startY + input.legend.metrics.paddingPx
        : startY +
          input.legend.metrics.paddingPx +
          index * (rowHeight + input.legend.metrics.itemGapPx);

    const leftX =
      input.legend.orientation === "horizontal"
        ? startX +
          input.legend.metrics.paddingPx +
          input.legend.items
            .slice(0, index)
            .reduce((acc, current) => acc + current.rowWidth, 0) +
          index * input.legend.metrics.itemGapPx
        : startX + input.legend.metrics.paddingPx;

    return {
      id: item.id,
      x: leftX,
      y: topY,
      width: item.rowWidth,
      height: rowHeight,
    };
  });
}

export function findLegendHit(
  boxes: readonly LegendItemBox[],
  x: number,
  y: number
): LegendItemBox | null {
  for (const box of boxes) {
    if (
      x >= box.x &&
      x <= box.x + box.width &&
      y >= box.y &&
      y <= box.y + box.height
    ) {
      return box;
    }
  }
  return null;
}

function resolveLegendPosition(input: {
  chartWidth: number;
  legendWidth: number;
  metrics: Required<LegendSizingOptions>;
}): LegendPosition {
  const reservedRight = input.legendWidth + input.metrics.rightReserveGapPx;
  const projectedPlotWidth = input.chartWidth - reservedRight - 24; // preserve both-side outer margins
  const safeLegendWidth = input.legendWidth + input.metrics.outerMarginPx + 8;
  if (
    input.chartWidth >= input.metrics.rightPlacementMinChartWidthPx &&
    safeLegendWidth <= input.chartWidth * input.metrics.rightPlacementMaxWidthRatio &&
    projectedPlotWidth >= input.metrics.rightPlacementMinPlotWidthPx
  ) {
    return "right";
  }
  return "bottom";
}

function measureLegendItems(input: {
  items: LegendItem[];
  measureText: MeasureTextFn;
  font: FontSpec;
  metrics: Required<LegendSizingOptions>;
}) {
  const measuredItems: LegendMeasuredItem[] = input.items.map((item) => {
    const measured = input.measureText({
      text: item.label,
      font: input.font,
      angle: 0,
    });
    const textWidth = measured.width;
    const textHeight = measured.height;
    const rowWidth =
      input.metrics.swatchSizePx + input.metrics.swatchTextGapPx + textWidth;
    return {
      ...item,
      textWidth,
      textHeight,
      rowWidth,
    };
  });

  let maxTextWidth = 0;
  let maxTextHeight = 0;
  let horizontalContentWidth = 0;

  for (const item of measuredItems) {
    if (item.textWidth > maxTextWidth) maxTextWidth = item.textWidth;
    if (item.textHeight > maxTextHeight) maxTextHeight = item.textHeight;
    horizontalContentWidth += item.rowWidth;
  }

  const rowHeight = Math.max(input.metrics.swatchSizePx, maxTextHeight);
  const verticalWidth =
    input.metrics.paddingPx * 2 +
    input.metrics.swatchSizePx +
    input.metrics.swatchTextGapPx +
    maxTextWidth;
  const verticalHeight =
    input.metrics.paddingPx * 2 +
    input.items.length * rowHeight +
    Math.max(0, input.items.length - 1) * input.metrics.itemGapPx;
  const horizontalWidth =
    input.metrics.paddingPx * 2 +
    horizontalContentWidth +
    Math.max(0, measuredItems.length - 1) * input.metrics.itemGapPx;
  const horizontalHeight = input.metrics.paddingPx * 2 + rowHeight;

  return {
    items: measuredItems,
    rowHeight,
    verticalWidth,
    verticalHeight,
    horizontalWidth,
    horizontalHeight,
  };
}

function withLegendMetricDefaults(
  metrics?: LegendSizingOptions
): Required<LegendSizingOptions> {
  return {
    swatchSizePx: metrics?.swatchSizePx ?? 9,
    swatchTextGapPx: metrics?.swatchTextGapPx ?? 6,
    itemGapPx: metrics?.itemGapPx ?? 6,
    paddingPx: metrics?.paddingPx ?? 4,
    outerMarginPx: metrics?.outerMarginPx ?? 6,
    rightReserveGapPx: metrics?.rightReserveGapPx ?? 12,
    bottomReserveGapPx: metrics?.bottomReserveGapPx ?? 10,
    rightPlacementMinChartWidthPx: metrics?.rightPlacementMinChartWidthPx ?? 420,
    rightPlacementMaxWidthRatio: metrics?.rightPlacementMaxWidthRatio ?? 0.24,
    rightPlacementMinPlotWidthPx: metrics?.rightPlacementMinPlotWidthPx ?? 260,
  };
}
