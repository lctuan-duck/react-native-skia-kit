/**
 * ShaderTestScreen — Phase 3 Visual Debug Screen
 *
 * Tests all Phase 3 gradient/shader features:
 *   1. Linear Gradient (angle variants)
 *   2. Radial Gradient
 *   3. Sweep Gradient
 *   4. Backdrop Blur / Glassmorphism
 *   5. Blend Modes
 *   6. Color Filter presets (grayscale, sepia, invert)
 *   7. Animated gradient (via AnimatedBox + Reanimated)
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  Column,
  Row,
  Box,
  Text,
  Button,
  ScrollView,
  useNav,
  useTheme,
  linearGradient,
  radialGradient,
  sweepGradient,
  colorPreset,
} from 'react-native-skia-kit';

// ─── Section header component ─────────────────────────────────────────────────
function SectionTitle({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Row
      style={{
        width: '100%',
        alignItems: 'center',
        gap: 12,
        paddingTop: 8,
        paddingBottom: 4,
      }}
    >
      <Box
        style={{
          width: 4,
          height: 20,
          borderRadius: 2,
          gradient: linearGradient(['#00E5FF', '#B000FF'], 180),
        }}
      />
      <Text
        text={title}
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: theme.colors.textBody,
        }}
      />
    </Row>
  );
}

// ─── Demo card wrapper ────────────────────────────────────────────────────────
function DemoCard({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const theme = useTheme();
  return (
    <Column style={{ alignItems: 'center', gap: 6 }}>
      {children}
      <Text
        text={label}
        style={{ fontSize: 11, color: theme.colors.textSecondary }}
      />
    </Column>
  );
}

// ─── 1. Linear Gradient demos ─────────────────────────────────────────────────
function LinearGradientSection() {
  const angles = [
    { deg: 0, label: '0° →' },
    { deg: 90, label: '90° ↓' },
    { deg: 135, label: '135° ↘' },
    { deg: 45, label: '45° ↗' },
  ];
  const colorSets = [
    ['#FF6B6B', '#FFE66D'],
    ['#6C63FF', '#3ECFCF'],
    ['#1a1a2e', '#533483'],
    ['#F7971E', '#FFD200'],
  ];

  return (
    <Column style={{ width: '100%', gap: 12 }}>
      <SectionTitle title="1. Linear Gradient" />
      <Row style={{ width: '100%', gap: 12, flexWrap: 'wrap' }}>
        {angles.map(({ deg, label }, i) => (
          <DemoCard key={deg} label={label}>
            <Box
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                gradient: linearGradient(colorSets[i]!, deg),
              }}
            />
          </DemoCard>
        ))}
      </Row>

      {/* Multi-stop gradient */}
      <DemoCard label="Multi-stop (5 colors)">
        <Box
          style={{
            width: '100%',
            height: 48,
            borderRadius: 12,
            gradient: linearGradient(
              ['#FF0080', '#FF6B6B', '#FFE66D', '#6C63FF', '#00E5FF'],
              0,
              { positions: [0, 0.25, 0.5, 0.75, 1] }
            ),
          }}
        />
      </DemoCard>

      {/* Repeat tile mode */}
      <DemoCard label="tileMode: repeat">
        <Box
          style={{
            width: '100%',
            height: 48,
            borderRadius: 12,
            gradient: linearGradient(['#1a1a2e', '#00E5FF'], 0, {
              tileMode: 'repeat',
            }),
          }}
        />
      </DemoCard>
    </Column>
  );
}

// ─── 2. Radial Gradient demos ─────────────────────────────────────────────────
function RadialGradientSection() {
  return (
    <Column style={{ width: '100%', gap: 12 }}>
      <SectionTitle title="2. Radial Gradient" />
      <Row style={{ width: '100%', gap: 16 }}>
        <DemoCard label="Centered">
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              gradient: radialGradient(['#FFFFFF', '#6C63FF']),
            }}
          />
        </DemoCard>

        <DemoCard label="Offset center">
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              gradient: radialGradient(['#FFE66D', '#FF6B6B'], {
                center: { x: 0.3, y: 0.3 },
                radius: 0.7,
              }),
            }}
          />
        </DemoCard>

        <DemoCard label="Wide radius">
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              gradient: radialGradient(['#00E5FF', '#1a1a2e'], {
                radius: 0.9,
              }),
            }}
          />
        </DemoCard>

        <DemoCard label="Multi-stop">
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              gradient: radialGradient(['#FFFFFF', '#FF6B6B', '#1a1a2e']),
            }}
          />
        </DemoCard>
      </Row>
    </Column>
  );
}

// ─── 3. Sweep Gradient demos ──────────────────────────────────────────────────
function SweepGradientSection() {
  return (
    <Column style={{ width: '100%', gap: 12 }}>
      <SectionTitle title="3. Sweep (Conic) Gradient" />
      <Row style={{ width: '100%', gap: 16 }}>
        <DemoCard label="Full 360°">
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              gradient: sweepGradient([
                '#FF6B6B',
                '#FFE66D',
                '#6C63FF',
                '#FF6B6B',
              ]),
            }}
          />
        </DemoCard>

        <DemoCard label="Rainbow">
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              gradient: sweepGradient([
                '#FF0000',
                '#FF8800',
                '#FFFF00',
                '#00FF00',
                '#0000FF',
                '#8800FF',
                '#FF0000',
              ]),
            }}
          />
        </DemoCard>

        <DemoCard label="Half 0→180°">
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              gradient: sweepGradient(['#00E5FF', '#B000FF'], {
                startAngle: 0,
                endAngle: 180,
              }),
            }}
          />
        </DemoCard>

        <DemoCard label="Square">
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              gradient: sweepGradient([
                '#FF6B6B',
                '#FFE66D',
                '#6C63FF',
                '#3ECFCF',
                '#FF6B6B',
              ]),
            }}
          />
        </DemoCard>
      </Row>
    </Column>
  );
}

// ─── 4. Backdrop Blur / Glassmorphism ─────────────────────────────────────────
function GlassmorphismSection() {
  return (
    <Column style={{ width: '100%', gap: 12 }}>
      <SectionTitle title="4. Backdrop Blur (Glassmorphism)" />

      {/* Background scene */}
      <Box
        style={{
          width: '100%',
          height: 200,
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        {/* Colorful background */}
        <Box
          style={{
            width: '100%',
            height: '100%',
            gradient: linearGradient(['#FF6B6B', '#6C63FF', '#3ECFCF'], 135),
          }}
        />

        {/* Some shapes behind the glass */}
        <Box
          style={{
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: 40,
            top: 20,
            left: 20,
            backgroundColor: '#FFE66D',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: 30,
            top: 100,
            left: 120,
            backgroundColor: '#FF0080',
          }}
        />

        {/* Glass card on top */}
        <Box
          style={{
            position: 'absolute',
            right: 16,
            top: 24,
            width: 140,
            height: 150,
            borderRadius: 20,
            backdropBlurRadius: 16,
            backgroundColor: '#FFFFFF30',
            borderWidth: 1,
            borderColor: '#FFFFFF60',
            padding: 16,
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <Text
            text="Glass Card"
            style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' }}
          />
          <Text
            text="Frosted glass effect"
            style={{ fontSize: 11, color: '#FFFFFF80' }}
          />
          <Box
            style={{
              width: '100%',
              height: 2,
              backgroundColor: '#FFFFFF40',
              borderRadius: 1,
            }}
          />
          <Text
            text="blur: 16px"
            style={{ fontSize: 11, color: '#FFFFFFCC' }}
          />
        </Box>
      </Box>

      {/* Blur radius comparison */}
      <Row style={{ width: '100%', gap: 8 }}>
        {[4, 8, 16, 24].map((blur) => (
          <DemoCard key={blur} label={`blur ${blur}`}>
            <Box
              style={{
                width: 72,
                height: 72,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  width: '100%',
                  height: '100%',
                  gradient: linearGradient(['#FF6B6B', '#6C63FF'], 135),
                }}
              />
              <Box
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '50%',
                  bottom: 0,
                  backdropBlurRadius: blur,
                  backgroundColor: '#FFFFFF20',
                }}
              />
            </Box>
          </DemoCard>
        ))}
      </Row>
    </Column>
  );
}

// ─── 5. Blend Mode demos ──────────────────────────────────────────────────────
function BlendModeSection() {
  const blendModes = [
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'colorDodge',
  ] as const;

  return (
    <Column style={{ width: '100%', gap: 12 }}>
      <SectionTitle title="5. Blend Modes" />
      <Row style={{ width: '100%', gap: 8, flexWrap: 'wrap' }}>
        {blendModes.map((mode) => (
          <DemoCard key={mode} label={mode}>
            <Box
              style={{
                width: 72,
                height: 72,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {/* Background */}
              <Box
                style={{
                  width: '100%',
                  height: '100%',
                  gradient: linearGradient(['#FF6B6B', '#FFE66D'], 135),
                }}
              />
              {/* Blend layer */}
              <Box
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  gradient: linearGradient(['#6C63FF', '#3ECFCF'], 45),
                  blendMode: mode,
                }}
              />
            </Box>
          </DemoCard>
        ))}
      </Row>
    </Column>
  );
}

// ─── 6. Color Filter presets ──────────────────────────────────────────────────
function ColorFilterSection() {
  const theme = useTheme();
  const presets = ['none', 'grayscale', 'sepia', 'invert'] as const;

  return (
    <Column style={{ width: '100%', gap: 12 }}>
      <SectionTitle title="6. Color Filters" />
      <Row style={{ width: '100%', gap: 12 }}>
        {presets.map((preset) => (
          <DemoCard key={preset} label={preset}>
            <Box
              style={{
                width: 72,
                height: 96,
                borderRadius: 12,
                colorFilter:
                  preset !== 'none' ? colorPreset(preset) : undefined,
                overflow: 'hidden',
              }}
            >
              {/* Colorful scene inside */}
              <Box
                style={{
                  width: '100%',
                  height: '60%',
                  gradient: linearGradient(
                    ['#FF6B6B', '#FFE66D', '#6C63FF'],
                    135
                  ),
                }}
              />
              <Box
                style={{
                  width: '100%',
                  height: '40%',
                  backgroundColor: theme.colors.surface,
                  padding: 4,
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box
                  style={{
                    width: '80%',
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: theme.colors.textSecondary,
                  }}
                />
                <Box
                  style={{
                    width: '60%',
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#00E5FF',
                  }}
                />
              </Box>
            </Box>
          </DemoCard>
        ))}
      </Row>
    </Column>
  );
}

function AnimatedGradientSection() {
  // JS-driven angle for live gradient rotation demo
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const handleToggleAngle = useCallback(() => {
    if (isAnimating) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsAnimating(false);
    } else {
      setIsAnimating(true);
      let a = 0;
      intervalRef.current = setInterval(() => {
        a = (a + 3) % 360;
        setCurrentAngle(a);
      }, 16);
    }
  }, [isAnimating]);

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <Column style={{ width: '100%', gap: 12 }}>
      <SectionTitle title="7. Animated Gradient (JS-driven)" />

      {/* Rotating gradient */}
      <Box
        style={{
          width: '100%',
          height: 120,
          borderRadius: 20,
          gradient: linearGradient(
            ['#FF6B6B', '#FFE66D', '#6C63FF', '#3ECFCF'],
            currentAngle
          ),
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <Text
          text={`Angle: ${Math.round(currentAngle)}°`}
          style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' }}
        />
        <Text
          text={isAnimating ? 'Rotating...' : 'Paused'}
          style={{ fontSize: 12, color: '#FFFFFF80' }}
        />
      </Box>

      <Button
        text={isAnimating ? 'Stop Rotation' : 'Start Rotation'}
        variant={isAnimating ? 'ghost' : 'solid'}
        color="primary"
        onPress={handleToggleAngle}
        style={{ height: 44, borderRadius: 12 }}
      />
    </Column>
  );
}

// ─── 8. Combined hero card (Gradient + Glassmorphism) ────────────────────────
function HeroCardSection() {
  return (
    <Column style={{ width: '100%', gap: 12 }}>
      <SectionTitle title="8. Hero Card (Combined)" />

      <Box
        style={{
          width: '100%',
          height: 200,
          borderRadius: 24,
          gradient: linearGradient(['#1a1a2e', '#0f3460', '#533483'], 135),
          shadowColor: '#6C63FF',
          shadowBlur: 24,
          shadowOpacity: 0.6,
          shadowOffsetY: 8,
          padding: 24,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Decorative circles */}
        <Box
          style={{
            position: 'absolute',
            width: 120,
            height: 120,
            borderRadius: 60,
            right: -20,
            top: -20,
            gradient: radialGradient(['#6C63FF40', '#00000000']),
          }}
        />
        <Box
          style={{
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: 40,
            right: 40,
            bottom: 20,
            gradient: radialGradient(['#00E5FF30', '#00000000']),
          }}
        />

        {/* Top row */}
        <Row style={{ justifyContent: 'space-between', width: '100%' }}>
          <Column>
            <Text
              text="SKIA KIT"
              style={{ fontSize: 12, color: '#FFFFFF60', letterSpacing: 3 }}
            />
            <Text
              text="Premium"
              style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' }}
            />
          </Column>
          {/* Glass badge */}
          <Box
            style={{
              paddingTop: 4,
              paddingBottom: 4,
              paddingLeft: 12,
              paddingRight: 12,
              borderRadius: 20,
              backdropBlurRadius: 8,
              backgroundColor: '#FFFFFF20',
              borderWidth: 1,
              borderColor: '#FFFFFF30',
            }}
          >
            <Text text="ACTIVE" style={{ fontSize: 11, color: '#00E5FF' }} />
          </Box>
        </Row>

        {/* Balance */}
        <Column>
          <Text
            text="BALANCE"
            style={{ fontSize: 11, color: '#FFFFFF60', letterSpacing: 2 }}
          />
          <Text
            text="$24,599.00"
            style={{ fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' }}
          />
        </Column>

        {/* Bottom */}
        <Row style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text
            text="**** **** **** 4281"
            style={{ fontSize: 14, color: '#FFFFFF60', letterSpacing: 2 }}
          />
          <Text text="12/28" style={{ fontSize: 14, color: '#FFFFFF' }} />
        </Row>
      </Box>

      {/* Sepia filter version */}
      <Row style={{ width: '100%', gap: 8 }}>
        <Box
          style={{
            flex: 1,
            height: 80,
            borderRadius: 16,
            colorFilter: colorPreset('sepia'),
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              width: '100%',
              height: '100%',
              gradient: linearGradient(['#FF6B6B', '#FFE66D', '#6C63FF'], 135),
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text text="sepia filter" style={{ fontSize: 12, color: '#FFF' }} />
          </Box>
        </Box>
        <Box
          style={{
            flex: 1,
            height: 80,
            borderRadius: 16,
            colorFilter: colorPreset('grayscale'),
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              width: '100%',
              height: '100%',
              gradient: linearGradient(['#FF6B6B', '#FFE66D', '#6C63FF'], 135),
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text text="grayscale" style={{ fontSize: 12, color: '#FFF' }} />
          </Box>
        </Box>
        <Box
          style={{
            flex: 1,
            height: 80,
            borderRadius: 16,
            colorFilter: colorPreset('invert'),
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              width: '100%',
              height: '100%',
              gradient: linearGradient(['#FF6B6B', '#FFE66D', '#6C63FF'], 135),
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text text="invert" style={{ fontSize: 12, color: '#000' }} />
          </Box>
        </Box>
      </Row>
    </Column>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function ShaderTestScreen() {
  const nav = useNav();
  const theme = useTheme();

  return (
    <Column
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Header */}
      <Row
        style={{
          width: '100%',
          padding: 16,
          paddingTop: 12,
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.divider,
        }}
      >
        <Button
          icon="arrow-left"
          variant="icon"
          color="primary"
          onPress={() => nav.pop()}
        />
        <Box style={{ flex: 1 }}>
          <Text
            text="Phase 3 Shader Debug"
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: theme.colors.textBody,
            }}
          />
          <Text
            text="Gradient • Blur • Blend • Filter"
            style={{ fontSize: 12, color: theme.colors.textSecondary }}
          />
        </Box>
      </Row>

      {/* Scrollable content */}
      <ScrollView style={{ width: '100%', flex: 1 }}>
        <Column
          style={{ width: '100%', padding: 20, gap: 32, paddingBottom: 60 }}
        >
          <LinearGradientSection />
          <RadialGradientSection />
          <SweepGradientSection />
          <GlassmorphismSection />
          <BlendModeSection />
          <ColorFilterSection />
          <AnimatedGradientSection />
          <HeroCardSection />

          {/* Status indicator */}
          <Box
            style={{
              width: '100%',
              padding: 16,
              borderRadius: 16,
              gradient: linearGradient(['#1a1a2e', '#0f3460'], 135),
              borderWidth: 1,
              borderColor: '#00E5FF40',
            }}
          >
            <Column style={{ gap: 8 }}>
              <Text
                text="✅ Phase 3 Features Active"
                style={{ fontSize: 14, fontWeight: 'bold', color: '#00E5FF' }}
              />
              <Text
                text="• linearGradient() — angle-based, multi-stop"
                style={{ fontSize: 12, color: '#FFFFFF80' }}
              />
              <Text
                text="• radialGradient() — center + radius control"
                style={{ fontSize: 12, color: '#FFFFFF80' }}
              />
              <Text
                text="• sweepGradient() — full/partial circle"
                style={{ fontSize: 12, color: '#FFFFFF80' }}
              />
              <Text
                text="• backdropBlurRadius — frosted glass"
                style={{ fontSize: 12, color: '#FFFFFF80' }}
              />
              <Text
                text="• blendMode — multiply/screen/overlay/..."
                style={{ fontSize: 12, color: '#FFFFFF80' }}
              />
              <Text
                text="• colorPreset() — grayscale/sepia/invert"
                style={{ fontSize: 12, color: '#FFFFFF80' }}
              />
            </Column>
          </Box>
        </Column>
      </ScrollView>
    </Column>
  );
}
