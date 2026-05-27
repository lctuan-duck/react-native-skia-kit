import * as React from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';

import { Box } from './Box';
import { Text } from './Text';
import { Icon } from './Icon';
import { Row } from './Row';
import { Expanded } from './Expanded';
import { useWidgetId } from '../hooks/useWidgetId';
import { useTheme } from '../hooks/useTheme';
import { useNativeYogaLayout } from '../hooks/useNativeYogaLayout';
import { useLayoutSharedValues } from '../hooks/useLayoutSharedValues';
import { useEngineContext } from '../core/EngineContext';
import type { WidgetProps } from '../types/widget.types';
import type {
  ColorStyle,
  BorderStyle,
  FlexChildStyle,
} from '../types/style.types';

export type TabBarVariant = 'tab' | 'segment';

export interface TabItem {
  label: string;
  icon?: string;
  disabled?: boolean;
}

export type TabBarStyle = ColorStyle &
  BorderStyle &
  FlexChildStyle & {
    activeColor?: string;
    inactiveColor?: string;
    indicatorColor?: string;
    width?: number;
    height?: number;
  };

export interface TabBarProps extends WidgetProps {
  items: TabItem[];
  activeIndex?: number;
  onChanged?: (index: number) => void;
  variant?: TabBarVariant;
  scrollable?: boolean;
  /** Style override */
  style?: TabBarStyle;
}

export const TabBar = React.memo(function TabBar({
  items,
  activeIndex = 0,
  onChanged,
  variant = 'tab',
  style,
}: TabBarProps) {
  const theme = useTheme();
  const { engine, engineId } = useEngineContext();
  const active = style?.activeColor ?? theme.colors.primary;
  const inactive = style?.inactiveColor ?? theme.colors.textSecondary;
  const bgColor =
    style?.backgroundColor ??
    (variant === 'segment'
      ? theme.colors.surfaceVariant
      : theme.colors.surface);
  const indicator = style?.indicatorColor ?? active;
  const borderRadius = style?.borderRadius ?? 24;
  const width = style?.width ?? 360;
  const height = style?.height ?? 48;
  const widgetId = useWidgetId('TabBar');
  const indicatorId = useWidgetId('TabBar-indicator');

  // WORKLET-SAFE FALLBACK: dùng useCallback + runOnJS thay vì ref.current pattern.
  // Dùng translateX thay vì left: translateX là GPU transform, không trigger Yoga layout.
  // left trigger Yoga recalculate trên UI thread → JniException (Yoga không thread-safe).
  const applyIndicatorPositionJS = React.useCallback((iId: string, tx: number) => {
    engine.updateAnimatedStyles(iId, { translateX: tx });
  }, [engine]);


  const layout = useNativeYogaLayout(widgetId, { width, height });
  const finalWidth =
    layout?.width > 0 ? layout.width : typeof width === 'number' ? width : 360;
  const tabWidth = finalWidth / Math.max(1, items.length);

  // TB3 animation fix: animated indicator X position
  const indicatorX = useSharedValue(activeIndex * tabWidth);

  // When activeIndex changes externally, slide indicator
  React.useEffect(() => {
    indicatorX.value = withTiming(activeIndex * tabWidth, { duration: 220 });
  }, [activeIndex, tabWidth, indicatorX]);

  // Phase 5: layoutSVs để auto-snap indicator khi layout thay đổi (screen rotation)
  // Không cần finalWidth/tabWidth trong worklet deps
  const layoutSVs = useLayoutSharedValues(widgetId);
  const numItems = items.length;

  // BUG-6 Fix: dùng SharedValue cho activeIndex trong worklet — tránh re-register
  // khi user chuyển tab. Worklet đọc activeIndexSV.value inline thay vì dùng closure.
  const activeIndexSV = useSharedValue(activeIndex);
  React.useEffect(() => {
    activeIndexSV.value = activeIndex;
  }, [activeIndex, activeIndexSV]);

  useAnimatedReaction(
    () => layoutSVs.width.value,
    (newWidth) => {
      'worklet';
      // Khi width thay đổi (layout computed/re-computed), re-snap indicator
      // không cần JS thread re-render để đưa lại indicator về đúng vị trí
      if (newWidth > 0) {
        const tw = newWidth / Math.max(1, numItems);
        indicatorX.value = activeIndexSV.value * tw;
      }
    },
    [numItems] // activeIndexSV là stable SharedValue — không cần trong deps
  );

  useAnimatedReaction(
    () => indicatorX.value,
    (x) => {
      'worklet';
      const direct = (global as any).skiaKitEngines?.[engineId]?.unbox();
      if (direct) {
        // translateX: GPU transform, không trigger Yoga layout, an toàn trên UI thread
        direct.updateAnimatedStyles(indicatorId, { translateX: x });
      } else {
        runOnJS(applyIndicatorPositionJS)(indicatorId, x);
      }
    },
    [indicatorId, engineId, applyIndicatorPositionJS]
  );

  if (variant === 'segment') {
    return (
      <Box
        id={widgetId}
        style={{
          width,
          height,
          borderRadius,
          backgroundColor: bgColor,
          flexDirection: 'row',
          padding: 2,
        }}
      >
        {items.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <Expanded key={i}>
              <Box
                style={{
                  height: height - 4,
                  borderRadius: borderRadius - 2,
                  backgroundColor: isActive ? theme.colors.surface : 'transparent',
                  elevation: isActive ? 2 : 0,
                  opacity: item.disabled ? 0.4 : 1,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: item.icon ? 6 : 0,
                }}
                hitTestBehavior="opaque"
                onPress={() => !item.disabled && onChanged?.(i)}
              >
                {item.icon && (
                  <Icon
                    name={item.icon}
                    size={16}
                    color={isActive ? active : inactive}
                  />
                )}
                <Text
                  text={item.label}
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? active : inactive,
                  }}
                />
              </Box>
            </Expanded>
          );
        })}
      </Box>
    );
  }

  // ── 'tab' variant — bottom indicator slides between tabs ──────────────────
  const indicatorW = tabWidth * 0.6;

  return (
    <Box
      id={widgetId}
      style={{
        width,
        height,
        backgroundColor: bgColor,
        flexDirection: 'row',
      }}
    >
      {items.map((item, i) => {
        const isActive = i === activeIndex;
        return (
          <Expanded key={i}>
            <Box
              style={{
                height,
                opacity: item.disabled ? 0.4 : 1,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              hitTestBehavior="opaque"
              onPress={() => {
                if (!item.disabled) {
                  // Animate indicator immediately on press (before state update)
                  indicatorX.value = withTiming(i * tabWidth, { duration: 220 });
                  onChanged?.(i);
                }
              }}
            >
              <Row style={{ gap: item.icon ? 6 : 0, alignItems: 'center' }}>
                {item.icon && (
                  <Icon
                    name={item.icon}
                    size={18}
                    color={isActive ? active : inactive}
                  />
                )}
                <Text
                  text={item.label}
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? active : inactive,
                  }}
                />
              </Row>
            </Box>
          </Expanded>
        );
      })}

      {/* Animated indicator — positioned via translateX (GPU transform, no Yoga, UI-thread safe) */}
      <Box
        id={indicatorId}
        style={{
          position: 'absolute',
          // left = centering offset within a single tab only.
          // Tab index offset is handled by translateX in updateAnimatedStyles.
          // translateX is a GPU transform — no Yoga recalculation, safe from UI thread.
          left: (tabWidth - indicatorW) / 2,
          top: height - 3,
          width: indicatorW,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: indicator,
        }}
      />
    </Box>
  );
});

(TabBar as any).skiaWidgetType = 'TabBar';