/**
 * Accessibility — Screen reader support for Skia components.
 * Phase 13: Accessibility.
 *
 * Since Skia Canvas renders everything as pixels (not native views),
 * we need to overlay invisible native AccessibilityElements to provide
 * screen reader support.
 *
 * This module provides:
 * - useAccessibility: Hook for components to declare accessibility info
 * - AccessibilityOverlay: Invisible native view layer for screen readers
 */

import * as React from 'react';
import { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import type { AccessibilityRole } from 'react-native';
import { useAccessibilityStore } from '../stores/accessibilityStore';

export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}

export interface AccessibilityNode {
  widgetId: string;
  label: string;
  role: AccessibilityRole;
  hint?: string;
  value?: { min?: number; max?: number; now?: number; text?: string };
  rect: { x: number; y: number; width: number; height: number };
  onPress?: () => void;
}

/**
 * Hook for components to register accessibility info.
 * Creates an invisible native view that screen readers can discover.
 *
 * @example
 * useAccessibility(widgetId, {
 *   accessible: true,
 *   accessibilityLabel: 'Submit button',
 *   accessibilityRole: 'button',
 *   accessibilityHint: 'Double tap to submit the form',
 * }, { x: 16, y: 100, width: 200, height: 48 }, onPress);
 */
export function useAccessibility(
  widgetId: string,
  props: AccessibilityProps,
  rect: { x: number; y: number; width: number; height: number },
  onPress?: () => void
) {
  useEffect(() => {
    if (!props.accessible) return;

    const node: AccessibilityNode = {
      widgetId,
      label: props.accessibilityLabel ?? '',
      role: props.accessibilityRole ?? 'none',
      hint: props.accessibilityHint,
      value: props.accessibilityValue,
      rect,
      onPress,
    };

    useAccessibilityStore.getState().registerNode(widgetId, node);

    return () => {
      useAccessibilityStore.getState().unregisterNode(widgetId);
    };
  }, [
    widgetId,
    props.accessible,
    props.accessibilityLabel,
    props.accessibilityRole,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
  ]);
}

/**
 * AccessibilityOverlay — Invisible native view layer for screen readers.
 *
 * Place this AFTER the CanvasRoot in your component tree.
 * It creates transparent native views that match the positions
 * of Skia-rendered accessible widgets.
 *
 * @example
 * <>
 *   <CanvasRoot>...</CanvasRoot>
 *   <AccessibilityOverlay />
 * </>
 */
export const AccessibilityOverlay = React.memo(function AccessibilityOverlay() {
  const nodes = useAccessibilityStore((s) => s.getNodes());

  if (Platform.OS === 'web') return null; // Web has its own a11y

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      importantForAccessibility="yes"
    >
      {nodes.map((node: AccessibilityNode) => (
        <View
          key={node.widgetId}
          accessible
          accessibilityLabel={node.label}
          accessibilityRole={node.role}
          accessibilityHint={node.hint}
          accessibilityValue={node.value}
          onAccessibilityTap={node.onPress}
          style={{
            position: 'absolute',
            left: node.rect.x,
            top: node.rect.y,
            width: node.rect.width,
            height: node.rect.height,
            backgroundColor: 'transparent',
          }}
        />
      ))}
    </View>
  );
});
