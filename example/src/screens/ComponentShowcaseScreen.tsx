/**
 * ComponentShowcaseScreen
 * Header → TabBar → Content (normal Yoga flow, no absolute positioning).
 * Tab switch uses a simple fade animation via React state + setTimeout.
 */
import * as React from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Box,
  TabBar,
  Icon,
  Text,
} from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit';
import { useNav } from 'react-native-skia-kit';

import { ButtonsTab } from './tabs/ButtonsTab';
import { FormsTab } from './tabs/FormsTab';
import { DisplayTab } from './tabs/DisplayTab';
import { FeedbackTab } from './tabs/FeedbackTab';

const TAB_ITEMS = [
  { icon: 'grid', label: 'Display' },
  { icon: 'edit', label: 'Forms' },
  { icon: 'square', label: 'Buttons' },
  { icon: 'bell', label: 'Feedback' },
];

const HEADER_HEIGHT = 48;
const TAB_BAR_HEIGHT = 44;
const TOP_CHROME = HEADER_HEIGHT + TAB_BAR_HEIGHT;

export function ComponentShowcaseScreen() {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const nav = useNav();

  // Two-state tab system for smooth fade:
  // activeTab = what the TabBar highlights (immediate)
  // renderTab = what content is mounted (delayed by fade-out duration)
  const [activeTab, setActiveTab] = React.useState(0);
  const [renderTab, setRenderTab] = React.useState(0);
  // opacity 0 or 1 — managed via C++ updateAnimatedStyles on the content box
  const [fading, setFading] = React.useState(false);
  const switchingRef = React.useRef(false);

  const tabTitles = ['Display', 'Forms', 'Buttons', 'Feedback'];
  const contentH = height - TOP_CHROME;

  const handleTabChange = React.useCallback(
    (nextTab: number) => {
      if (nextTab === activeTab || switchingRef.current) return;
      switchingRef.current = true;

      // Phase 1: fade out (dim the content)
      setFading(true);
      setActiveTab(nextTab);

      // Phase 2: after 100ms, swap the mounted content
      setTimeout(() => {
        setRenderTab(nextTab);
        // Phase 3: after content mounts, fade in
        setTimeout(() => {
          setFading(false);
          switchingRef.current = false;
        }, 16); // one frame for reconciler
      }, 100);
    },
    [activeTab]
  );

  return (
    <Box
      style={{
        width,
        height,
        backgroundColor: theme.colors.background,
        flexDirection: 'column',
      }}
    >
      {/* ── Header bar ── */}
      <Box
        style={{
          width,
          height: HEADER_HEIGHT,
          backgroundColor: theme.colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          padding: [0, 8, 0, 16],
          gap: 8,
        }}
      >
        <Box style={{ flex: 1 }}>
          <Text
            text={`SkiaKit · ${tabTitles[activeTab]}`}
            style={{ fontSize: 17, fontWeight: 'bold', color: '#ffffff' }}
          />
        </Box>
        <Box
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          hitTestBehavior="opaque"
          onPress={() => nav.push('ShaderTest')}
        >
          <Icon name="activity" size={20} color="#ffffff" />
        </Box>
      </Box>

      {/* ── Tab bar ── */}
      <Box
        style={{
          width,
          height: TAB_BAR_HEIGHT,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.divider,
        }}
      >
        <TabBar
          items={TAB_ITEMS}
          activeIndex={activeTab}
          onChanged={handleTabChange}
          variant="tab"
          style={{
            width,
            height: TAB_BAR_HEIGHT,
            backgroundColor: theme.colors.surface,
          }}
        />
      </Box>

      {/* ── Content area — opacity fades during tab switch ── */}
      <Box
        style={{
          width,
          height: contentH,
          backgroundColor: theme.colors.background,
          // React-level opacity fade: 1.0 → 0.0 on switch, 0.0 → 1.0 after mount
          // C++ engine reads BoxStyle.opacity for immediate Skia canvas update
          opacity: fading ? 0 : 1,
        }}
      >
        {renderTab === 0 && <DisplayTab width={width} height={contentH} />}
        {renderTab === 1 && <FormsTab width={width} height={contentH} />}
        {renderTab === 2 && <ButtonsTab width={width} height={contentH} />}
        {renderTab === 3 && <FeedbackTab width={width} height={contentH} />}
      </Box>
    </Box>
  );
}
