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

  const tabTitles = ['Display', 'Forms', 'Buttons', 'Feedback'];
  const contentH = height - TOP_CHROME;

  const handleTabChange = React.useCallback(
    (nextTab: number) => {
      if (nextTab === activeTab) return;
      // Single state update = 1 reconciler commit = 1 calculateLayout pass.
      // The old 3-phase setTimeout approach caused 3 rapid commits
      // (setFading, setRenderTab, setFading) each triggering full Yoga layout
      // recalc with 60+ text measurements → dropped frames + blank screen.
      setActiveTab(nextTab);
      setRenderTab(nextTab);
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

      <Box
        style={{
          width,
          height: contentH,
          backgroundColor: theme.colors.background,
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
