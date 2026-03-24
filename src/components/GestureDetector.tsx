import * as React from 'react';
import { Group } from '@shopify/react-native-skia';
import { Box } from './Box';
import { useWidget } from '../hooks/useWidget';
import { useHitTest } from '../hooks/useHitTest';
import type {
  WidgetProps,
  HitTestBehavior,
  PanEvent,
} from '../types/widget.types';

// ===== GestureDetector =====

export interface GestureDetectorProps extends WidgetProps {
  children: React.ReactNode;
  /** Width for hit test zone */
  width?: number;
  /** Height for hit test zone */
  height?: number;
  /** Tap callback (maps to onPress internally) */
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPanStart?: (e: PanEvent) => void;
  onPanUpdate?: (e: PanEvent) => void;
  onPanEnd?: (e: PanEvent) => void;
  hitTestBehavior?: HitTestBehavior;
}

/**
 * GestureDetector — wraps children with gesture recognition.
 * Declarative wrapper around useWidget + useHitTest.
 * Tương đương Flutter GestureDetector.
 */
export const GestureDetector = React.memo(function GestureDetector({
  x = 0,
  y = 0,
  width,
  height,
  children,
  onTap,
  onDoubleTap: _onDoubleTap,
  onLongPress,
  onPanStart,
  onPanUpdate,
  onPanEnd,
  hitTestBehavior = 'deferToChild',
}: GestureDetectorProps) {
  const w = width ?? 0;
  const h = height ?? 0;

  const widgetId = useWidget({
    type: 'GestureDetector',
    layout: { x, y, width: w, height: h },
  });

  useHitTest(widgetId, {
    rect: { left: x, top: y, width: w, height: h },
    callbacks: {
      onPress: onTap,
      onLongPress,
      onPanStart,
      onPanUpdate,
      onPanEnd,
    },
    behavior: hitTestBehavior,
  });

  return <Group>{children}</Group>;
});

// ===== Dismissible =====

export interface DismissibleProps extends WidgetProps {
  children: React.ReactNode;
  /** Width for hit test zone */
  width?: number;
  /** Height for hit test zone */
  height?: number;
  onDismiss: () => void;
  direction?: 'horizontal' | 'vertical';
  /** Dismiss threshold in pixels (default: 100) */
  threshold?: number;
}

/**
 * Dismissible — swipe to dismiss.
 * Tracks pan translation and triggers dismiss when threshold is exceeded.
 * Tương đương Flutter Dismissible.
 */
export const Dismissible = React.memo(function Dismissible({
  x = 0,
  y = 0,
  width = 360,
  height = 56,
  children,
  onDismiss,
  direction = 'horizontal',
  threshold = 100,
}: DismissibleProps) {
  useWidget({
    type: 'Dismissible',
    layout: { x, y, width, height },
  });

  return (
    <Box
      x={x}
      y={y}
      style={{ width, height }}
      hitTestBehavior="opaque"
      onPanEnd={(e: PanEvent) => {
        const translation =
          direction === 'horizontal'
            ? Math.abs(e?.translationX ?? 0)
            : Math.abs(e?.translationY ?? 0);
        if (translation >= threshold) {
          onDismiss?.();
        }
      }}
    >
      {children}
    </Box>
  );
});

// ===== Draggable =====

export interface DraggableProps extends WidgetProps {
  children: React.ReactNode;
  /** Width for hit test zone */
  width?: number;
  /** Height for hit test zone */
  height?: number;
  onDragStart?: () => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  onDragUpdate?: (position: { x: number; y: number }) => void;
  feedback?: React.ReactNode;
}

/**
 * Draggable — drag interaction.
 * Tracks drag position via pan gesture events.
 * Tương đương Flutter Draggable.
 */
export const Draggable = React.memo(function Draggable({
  x = 0,
  y = 0,
  width = 60,
  height = 60,
  children,
  onDragStart,
  onDragEnd,
  onDragUpdate,
}: DraggableProps) {
  useWidget({
    type: 'Draggable',
    layout: { x, y, width, height },
  });

  return (
    <Box
      x={x}
      y={y}
      style={{ width, height }}
      hitTestBehavior="opaque"
      onPanStart={() => onDragStart?.()}
      onPanUpdate={(e: PanEvent) => {
        onDragUpdate?.({ x: e.absoluteX, y: e.absoluteY });
      }}
      onPanEnd={(e: PanEvent) => {
        onDragEnd?.({ x: e?.absoluteX ?? 0, y: e?.absoluteY ?? 0 });
      }}
    >
      {children}
    </Box>
  );
});
