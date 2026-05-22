import * as React from 'react';
import { Box } from './Box';
import { useWidgetId } from '../hooks/useWidgetId';
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
 * Declarative wrapper around Box.
 * Equivalent to Flutter GestureDetector.
 */
export const GestureDetector = React.memo(function GestureDetector({
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
  const widgetId = useWidgetId('GestureDetector');

  return (
    <Box
      id={widgetId}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        backgroundColor: 'transparent',
      }}
      hitTestBehavior={hitTestBehavior}
      onPress={onTap}
      onLongPress={onLongPress}
      onPanStart={onPanStart}
      onPanUpdate={onPanUpdate}
      onPanEnd={onPanEnd}
    >
      {children}
    </Box>
  );
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
 * Equivalent to Flutter Dismissible.
 */
export const Dismissible = React.memo(function Dismissible({
  width = 360,
  height = 56,
  children,
  onDismiss,
  direction = 'horizontal',
  threshold = 100,
}: DismissibleProps) {
  const widgetId = useWidgetId('Dismissible');

  return (
    <Box
      id={widgetId}
      style={{ width, height, backgroundColor: 'transparent' }}
      hitTestBehavior="opaque"
      onPanEnd={(e: PanEvent) => {
        const delta = direction === 'horizontal' ? Math.abs(e.translationX) : Math.abs(e.translationY);
        if (delta > threshold) {
          onDismiss();
        }
      }}
    >
      {children}
    </Box>
  );
});
