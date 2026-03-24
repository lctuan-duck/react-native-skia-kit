import * as React from 'react';
import { Group, Path } from '@shopify/react-native-skia';
import type { WidgetProps } from '../types/widget.types';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import { useTheme } from '../hooks/useTheme';

/** Built-in SVG path based icons (24x24 viewBox) */
const iconMap: Record<string, { path: string; style: 'stroke' | 'fill' }> = {
  'star': {
    path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    style: 'fill',
  },
  'arrow-right': { path: 'M10 6l6 6-6 6', style: 'stroke' },
  'arrow-left': { path: 'M14 6l-6 6 6 6', style: 'stroke' },
  'chevron-down': { path: 'M6 9l6 6 6-6', style: 'stroke' },
  'chevron-up': { path: 'M6 15l6-6 6 6', style: 'stroke' },
  'user': {
    path: 'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z',
    style: 'fill',
  },
  'close': { path: 'M18 6L6 18M6 6l12 12', style: 'stroke' },
  'check': { path: 'M5 13l4 4L19 7', style: 'stroke' },
  'info': {
    path: 'M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    style: 'fill',
  },
  'search': {
    path: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14A4.5 4.5 0 1114 9.5 4.49 4.49 0 019.5 14z',
    style: 'fill',
  },
  'home': { path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', style: 'fill' },
  'bell': {
    path: 'M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    style: 'fill',
  },
  'plus': { path: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z', style: 'fill' },
  'more': {
    path: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    style: 'fill',
  },
  'edit': {
    path: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    style: 'fill',
  },
  'trash': {
    path: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    style: 'fill',
  },
  'share': {
    path: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
    style: 'fill',
  },
  'lock': {
    path: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z',
    style: 'fill',
  },
  'menu': {
    path: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    style: 'fill',
  },
  'mail': {
    path: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    style: 'fill',
  },
  'send': { path: 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z', style: 'fill' },
  'heart': {
    path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    style: 'fill',
  },
  'flag-vn': {
    path: 'M3 3h18v18H3V3zm9 13.5l-1.76-.92-1.76.92.34-1.96-1.42-1.39 1.97-.29L12 5.5l.88 1.79 1.97.29-1.42 1.39.34 1.96L12 16.5z',
    style: 'fill',
  },
  'cog': {
    path: 'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.61 3.61 0 0112 15.6z',
    style: 'fill',
  },
  'message': {
    path: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
    style: 'fill',
  },
  'users': {
    path: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    style: 'fill',
  },
};

export interface IconProps extends WidgetProps {
  /** Icon name from built-in icon map — REQUIRED */
  name: string;
  /** Size (default: 24) */
  size?: number;
  /** Color (default: theme.colors.textBody) */
  color?: string;
  /** Opacity 0-1 */
  opacity?: number;
  /** Press callback */
  onPress?: () => void;
  /** Accessibility label */
  accessibilityLabel?: string;
}

/**
 * Icon — SVG path-based icon.
 * Uses Skia Path node directly on the shared canvas.
 *
 * Tương đương Flutter Icon + IconData.
 */
export const Icon = React.memo(function Icon({
  x = 0,
  y = 0,
  name,
  size = 24,
  color,
  opacity = 1,
  onPress,
}: IconProps) {
  const theme = useTheme();
  const iconColor = color ?? theme.colors.textBody;
  const entry = iconMap[name];
  const scale = size / 24;

  const widgetId = useWidget({
    type: 'Icon',
    layout: { x, y, width: size, height: size },
  });

  useHitTest(widgetId, {
    rect: { left: x, top: y, width: size, height: size },
    callbacks: { onPress },
    behavior: 'opaque',
  });

  return (
    <Group
      opacity={opacity}
      transform={[
        { translateX: x },
        { translateY: y },
        { scaleX: scale },
        { scaleY: scale },
      ]}
    >
      {entry ? (
        entry.style === 'fill' ? (
          <Path path={entry.path} color={iconColor} />
        ) : (
          <Path
            path={entry.path}
            color={iconColor}
            style="stroke"
            strokeWidth={2}
            strokeCap="round"
            strokeJoin="round"
          />
        )
      ) : (
        // Fallback: X icon for unknown names
        <Path
          path="M6 6l12 12M6 18L18 6"
          color={iconColor}
          style="stroke"
          strokeWidth={2}
        />
      )}
    </Group>
  );
});

/** Get all available icon names */
export function getIconNames(): string[] {
  return Object.keys(iconMap);
}
