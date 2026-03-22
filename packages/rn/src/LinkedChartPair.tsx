import React from 'react';
import {
  View,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

export type LinkedChartPairProps = {
  /**
   * Top chart (e.g. primary KPI with its own `yAxisTitle` and `formatY`).
   * Often omit `xAxisTitle` here so the shared time dimension is labeled once on the bottom chart.
   */
  top: React.ReactNode;
  /**
   * Bottom chart (typically carries `xAxisTitle` such as “Date” / “Week”).
   * Use the same `xTickValues` and `xTickDomainMode` as the top chart so both
   * plots share an aligned x domain without a dual y-axis.
   */
  bottom: React.ReactNode;
  /** Vertical space between the two charts (default 12). */
  gap?: number;
  /**
   * Short note under the pair (e.g. reminding readers that scales are separate
   * but dates align).
   */
  caption?: string;
  captionStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  /** Accessibility label for the stacked pair container. */
  accessibilityLabel?: string;
};

/**
 * Stacks two charts vertically for metrics that must not share one y-scale.
 *
 * Why this exists:
 * - Dual y-axes invite misreadings (different scales imply relationships that may not exist).
 * - Two separate charts with the **same x domain** keep each y-axis honest while still
 *   allowing visual correlation by scanning vertically.
 *
 * Axis labeling guidance:
 * - Give each chart a **distinct `yAxisTitle`** with units (e.g. “USD”, “%”, “count”).
 * - Put the **shared dimension** on the bottom chart’s **`xAxisTitle`** (time, category, index).
 * - Optionally repeat `xAxisTitle` on the top chart if your layout omits bottom x labels.
 * - Use **`formatY`** per chart when units differ (currency vs percent).
 * - Pass identical **`xTickValues`** (and matching `xTickDomainMode`) so ticks line up.
 *
 * This component is layout-only; interaction sync (e.g. shared scrub index) is an app concern.
 */
export function LinkedChartPair(props: LinkedChartPairProps) {
  const gap = props.gap ?? 12;
  return (
    <View
      style={props.style}
      accessibilityLabel={props.accessibilityLabel}
      accessible={Boolean(props.accessibilityLabel)}
    >
      <View style={{ marginBottom: gap }}>{props.top}</View>
      {props.bottom}
      {props.caption ? (
        <Text style={[{ marginTop: 8 }, props.captionStyle]}>{props.caption}</Text>
      ) : null}
    </View>
  );
}
