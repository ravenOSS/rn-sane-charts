import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { Series } from '@rn-sane-charts/core';

const series: Series[] = [
  {
    id: 'Revenue',
    data: [
      { x: new Date('2026-01-01T00:00:00.000Z'), y: 10 },
      { x: new Date('2026-01-02T00:00:00.000Z'), y: 16 },
      { x: new Date('2026-01-03T00:00:00.000Z'), y: 12 },
    ],
  },
];

const fonts = {
  measureText: ({ text }: { text: string }) => ({
    width: text.length * 7,
    height: 12,
  }),
  xTickFont: { family: 'System', size: 12, weight: 400 as const },
  yTickFont: { family: 'System', size: 12, weight: 400 as const },
  titleFont: { family: 'System', size: 16, weight: 600 as const },
  subtitleFont: { family: 'System', size: 12, weight: 400 as const },
};

const hookStateEntries: Array<{
  initial: unknown;
  set: ReturnType<typeof vi.fn>;
}> = [];

function installHookDispatcher() {
  const internals = (React as any)
    .__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  internals.H = {
    useMemo: <T,>(factory: () => T) => factory(),
    useCallback: <T extends (...args: any[]) => any>(fn: T) => fn,
    useEffect: () => {},
    useState: <T,>(initial: T) => {
      let current = initial;
      const set = vi.fn((next: T | ((prev: T) => T)) => {
        current =
          typeof next === 'function'
            ? (next as (prev: T) => T)(current)
            : next;
        return current;
      });
      hookStateEntries.push({ initial, set });
      return [current, set] as const;
    },
    useContext: (ctx: { _currentValue?: unknown }) => ctx?._currentValue,
    useRef: <T,>(value: T) => ({ current: value }),
    useReducer: <T,>(
      _reducer: (prev: T, _next: unknown) => T,
      initialArg: T
    ) => [initialArg, vi.fn()] as const,
    useLayoutEffect: () => {},
    useInsertionEffect: () => {},
    useImperativeHandle: () => {},
    useDebugValue: () => {},
    useTransition: () => [false, vi.fn()] as const,
    useDeferredValue: <T,>(value: T) => value,
    useId: () => 'test-id',
    useSyncExternalStore: () => undefined,
    useOptimistic: <T,>(value: T) => [value, vi.fn()] as const,
    useActionState: <T,>(value: T) => [value, vi.fn(), false] as const,
    use: <T,>(value: T) => value,
    useHostTransitionStatus: () => null,
    useMemoCache: () => [],
    useEffectEvent: <T extends (...args: any[]) => any>(fn: T) => fn,
    useCacheRefresh: () => vi.fn(),
  };
}

/**
 * Walk any React element tree (including nested arrays/fragments) and collect
 * nodes that match the provided predicate.
 */
function collectElements(
  node: unknown,
  predicate: (element: { type: unknown; props: Record<string, unknown> }) => boolean
): Array<{ type: unknown; props: Record<string, unknown> }> {
  const out: Array<{ type: unknown; props: Record<string, unknown> }> = [];

  const visit = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (typeof value === 'object' && 'type' in value && 'props' in value) {
      const element = value as { type: unknown; props: Record<string, unknown> };
      if (predicate(element)) out.push(element);
      visit(element.props.children);
    }
  };

  visit(node);
  return out;
}

beforeEach(async () => {
  hookStateEntries.length = 0;
  installHookDispatcher();
});

describe('rn smoke tests', () => {
  it('renders chart scaffolding with grid lines when grid token is enabled', async () => {
    const { Chart } = await import('../Chart');
    const element = Chart({
      width: 360,
      height: 240,
      series,
      fonts,
      theme: {
        grid: { stroke: '#123456', strokeWidth: 1 },
      },
      children: null,
    });

    const gridLines = collectElements(
      element,
      (entry) => entry.type === 'Line' && entry.props.color === '#123456'
    );
    expect(gridLines.length).toBeGreaterThan(0);
  });

  it('executes interaction responder path on responder grant', async () => {
    const { Chart } = await import('../Chart');

    const element = Chart({
      width: 360,
      height: 240,
      series,
      fonts,
      legend: { show: true, interactive: true },
      interaction: { enabled: true, snap: 'nearest' },
      children: null,
    });

    const onResponderGrant = (element as any).props.onResponderGrant as
      | ((event: { nativeEvent: { locationX: number; locationY: number } }) => void)
      | undefined;
    expect(typeof onResponderGrant).toBe('function');

    onResponderGrant?.({
      nativeEvent: { locationX: 5, locationY: 5 },
    });

    const interactionState = hookStateEntries.find(
      (entry) => entry.initial === null
    );

    expect(interactionState).toBeDefined();
    expect(interactionState?.set).toHaveBeenCalled();
  });
});
