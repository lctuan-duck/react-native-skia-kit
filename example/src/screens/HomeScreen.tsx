
import {
  Column,
  Row,
  Box,
  Text,
  Button,
  Avatar,
  Expanded,
  Hero,
  Icon,
  VirtualizedList,
  useNav,
  useTheme,
} from 'react-native-skia-kit';
import { useWindowDimensions } from 'react-native';

const TRANSACTIONS = Array.from({ length: 50 }).map((_, i) => ({
  id: `tx-${i}`,
  title: i % 2 === 0 ? 'Apple Store' : 'Starbucks',
  date: 'Today, 10:24 AM',
  amount: i % 2 === 0 ? '-$999.00' : '-$5.50',
  icon: i % 2 === 0 ? 'laptop' : 'coffee',
  color: i % 2 === 0 ? '#00E5FF' : '#B000FF',
}));

export function HomeScreen() {
  const { width } = useWindowDimensions();
  const nav = useNav();
  const theme = useTheme();

  return (
    <Column
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.background,
        padding: 60, // approximate top padding
      }}
    >
      {/* Header */}
      <Row
        style={{
          width: '100%',
          padding: 24,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Row style={{ gap: 12, alignItems: 'center' }}>
          <Avatar
            src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
            size={48}
          />
          <Column>
            <Text
              text="Good Morning,"
              style={{ fontSize: 14, color: theme.colors.textSecondary }}
            />
            <Text
              text="Alex Protassov"
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: theme.colors.textBody,
              }}
            />
          </Column>
        </Row>
        <Button icon="notifications" variant="icon" color="primary" />
      </Row>

      {/* Credit Card Hero */}
      <Hero tag="credit-card" x={24} y={130} width={width - 48} height={220}>
        <Box
          interactive="ripple"
          onPress={() => nav.push('CardDetail')}
          style={{
            width: width - 48,
            height: 220,
            borderRadius: 24,
            backgroundColor: '#1A1A2E',
            elevation: 16,
            padding: 24,
            flexDirection: 'column',
            justifyContent: 'space-between',
            // Simple gradient-like feel using dark solid with bright border
            borderWidth: 1,
            borderColor: '#00E5FF40',
          }}
        >
          <Row style={{ justifyContent: 'space-between', width: width - 96 }}>
            <Icon name="credit-card" size={32} color="#00E5FF" />
            <Text
              text="VISA"
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#FFFFFF',
                fontStyle: 'italic',
              }}
            />
          </Row>
          <Column>
            <Text
              text="BALANCE"
              style={{ fontSize: 12, color: '#00E5FF80', letterSpacing: 2 }}
            />
            <Text
              text="$24,599.00"
              style={{ fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' }}
            />
          </Column>
          <Row style={{ justifyContent: 'space-between', width: width - 96 }}>
            <Text
              text="**** **** **** 4281"
              style={{ fontSize: 16, color: '#FFFFFF80', letterSpacing: 4 }}
            />
            <Text text="12/28" style={{ fontSize: 16, color: '#FFFFFF' }} />
          </Row>
        </Box>
      </Hero>

      {/* Quick Actions */}
      <Row style={{ width: '100%', padding: 24, justifyContent: 'space-between' }}>
        {['Send', 'Receive', 'Scan', 'More'].map((action, i) => (
          <Column key={action} style={{ alignItems: 'center', gap: 8 }}>
            <Box
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: theme.colors.surface,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              interactive="ripple"
            >
              <Icon
                name={
                  ['arrow-upward', 'arrow-downward', 'qr-code', 'more-horiz'][
                    i
                  ] as any
                }
                size={24}
                color="#00E5FF"
              />
            </Box>
            <Text
              text={action}
              style={{ fontSize: 12, color: theme.colors.textSecondary }}
            />
          </Column>
        ))}
      </Row>

      {/* Transactions */}
      <Box
        style={{
          width: '100%',
          flex: 1,
          backgroundColor: theme.colors.surface,
          borderRadius: 32,
          padding: 24,
        }}
      >
        <Box style={{ padding: 16 }}>
          <Text
            text="Recent Transactions"
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: theme.colors.textBody,
            }}
          />
        </Box>
        <Box style={{ width: '100%', flex: 1 }}>
        <VirtualizedList
          data={TRANSACTIONS}
          itemHeight={76}
          renderItem={(item) => (
            <Row
              style={{
                width: '100%',
                height: 76,
                padding: 24,
                alignItems: 'center',
                gap: 16,
              }}
            >
              <Box
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${item.color}20`,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon name={item.icon as any} size={24} color={item.color} />
              </Box>
              <Expanded>
                <Column>
                  <Text
                    text={item.title}
                    style={{
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: theme.colors.textBody,
                    }}
                  />
                  <Text
                    text={item.date}
                    style={{ fontSize: 12, color: theme.colors.textSecondary }}
                  />
                </Column>
              </Expanded>
              <Text
                text={item.amount}
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: theme.colors.textBody,
                }}
              />
            </Row>
          )}
        />
        </Box>
      </Box>
    </Column>
  );
}
