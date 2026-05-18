import { useState } from 'react';
import {
  Column,
  Row,
  Box,
  Text,
  Button,
  Hero,
  Icon,
  Switch,
  Slider,
  ScrollView,
  useNav,
  useTheme,
} from 'react-native-skia-kit';
import { useWindowDimensions } from 'react-native';

export function CardDetailScreen() {
  const { width } = useWindowDimensions();
  const nav = useNav();
  const theme = useTheme();

  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [intlEnabled, setIntlEnabled] = useState(false);
  const [limit, setLimit] = useState(2500);

  return (
    <Column
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.background,
        padding: 60,
      }}
    >
      {/* Header */}
      <Row style={{ width: '100%', padding: 24, alignItems: 'center' }}>
        <Button icon="arrow-back" variant="icon" color="primary" onPress={() => nav.pop()} />
        <Box style={{ width: 16 }} />
        <Text text="Card Details" style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.textBody }} />
      </Row>

      <ScrollView x={0} y={132} style={{ width: '100%', flex: 1 }} contentSize={800}>
        <Column style={{ width: '100%', alignItems: 'center', gap: 32, padding: 64 }}>
          {/* Credit Card Hero (Rotated/Expanded style) */}
          <Hero tag="credit-card" x={(width - 320) / 2} y={0} width={320} height={480}>
            <Box
              style={{
                width: 320,
                height: 480,
                borderRadius: 24,
                backgroundColor: '#1A1A2E',
                elevation: 24,
                padding: 32,
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: '#00E5FF80',
              }}
            >
              <Row style={{ justifyContent: 'space-between', width: 256 }}>
                <Icon name="credit-card" size={32} color="#00E5FF" />
                <Text text="VISA" style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', fontStyle: 'italic' }} />
              </Row>
              <Column>
                <Text text="BALANCE" style={{ fontSize: 14, color: '#00E5FF80', letterSpacing: 2 }} />
                <Text text="$24,599.00" style={{ fontSize: 42, fontWeight: 'bold', color: '#FFFFFF' }} />
              </Column>
              <Column style={{ gap: 16 }}>
                <Text text="**** **** **** 4281" style={{ fontSize: 20, color: '#FFFFFF80', letterSpacing: 6 }} />
                <Row style={{ justifyContent: 'space-between', width: 256 }}>
                  <Column>
                    <Text text="CARD HOLDER" style={{ fontSize: 10, color: '#FFFFFF80' }} />
                    <Text text="ALEX PROTASSOV" style={{ fontSize: 14, color: '#FFFFFF' }} />
                  </Column>
                  <Column>
                    <Text text="EXPIRES" style={{ fontSize: 10, color: '#FFFFFF80' }} />
                    <Text text="12/28" style={{ fontSize: 14, color: '#FFFFFF' }} />
                  </Column>
                  <Column>
                    <Text text="CVV" style={{ fontSize: 10, color: '#FFFFFF80' }} />
                    <Text text="***" style={{ fontSize: 14, color: '#FFFFFF' }} />
                  </Column>
                </Row>
              </Column>
            </Box>
          </Hero>

          {/* Controls */}
          <Column style={{ width: width - 48, gap: 24 }}>
            <Text text="Card Settings" style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.textBody }} />
            
            <Row style={{ width: width - 48, justifyContent: 'space-between', alignItems: 'center' }}>
              <Column>
                <Text text="Online Payments" style={{ fontSize: 16, color: theme.colors.textBody }} />
                <Text text="Enable transactions on the internet" style={{ fontSize: 12, color: theme.colors.textSecondary }} />
              </Column>
              <Switch value={onlineEnabled} onChange={setOnlineEnabled} color="primary" />
            </Row>

            <Row style={{ width: width - 48, justifyContent: 'space-between', alignItems: 'center' }}>
              <Column>
                <Text text="International Usage" style={{ fontSize: 16, color: theme.colors.textBody }} />
                <Text text="Enable transactions abroad" style={{ fontSize: 12, color: theme.colors.textSecondary }} />
              </Column>
              <Switch value={intlEnabled} onChange={setIntlEnabled} color="primary" />
            </Row>

            <Column style={{ gap: 16, padding: 16 }}>
              <Row style={{ width: width - 48, justifyContent: 'space-between' }}>
                <Text text="Spending Limit" style={{ fontSize: 16, color: theme.colors.textBody }} />
                <Text text={`$${limit}`} style={{ fontSize: 16, fontWeight: 'bold', color: '#00E5FF' }} />
              </Row>
              <Slider
                value={limit}
                min={0}
                max={10000}
                onChange={setLimit}
                color="primary"
              />
            </Column>
            
            <Button
              text="Freeze Card"
              variant="outline"
              color="error"
              style={{ margin: 24, height: 56, borderRadius: 16 }}
            />
          </Column>
        </Column>
      </ScrollView>
    </Column>
  );
}
