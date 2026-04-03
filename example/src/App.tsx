import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  CanvasRoot,
  ScrollView,
  Box,
  Column,
  Row,
  Text,
  Button,
  Avatar,
  Divider,
  Badge,
  Chip,
  Switch,
  Checkbox,
  Radio,
  Progress,
  Slider,
  Input,
  SafeArea,
  Card,
  ListTile,
  TabBar,
  BottomNavigationBar,
  Icon,
  Stack,
} from 'react-native-skia-kit';

function UIComponentsGallery() {
  const { width, height } = useWindowDimensions();
  const [isOn, setIsOn] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [radioVal, setRadioVal] = useState('1');
  const [sliderVal, setSliderVal] = useState(50);
  const [textVal, setTextVal] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [activeBottomNav, setActiveBottomNav] = useState(0);

  // Padding & constants
  const p = 16;
  const contentWidth = width - p * 2;

  // A helper to draw a section
  const renderSection = (title: string, content: React.ReactNode) => (
    <Column
      style={{
        width: contentWidth,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        gap: 16,
      }}
    >
      <Text
        text={title}
        style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1F2937',
        }}
      />
      <Divider
        style={{
          width: contentWidth - 32,
          height: 1,
          backgroundColor: '#E5E7EB',
        }}
      />
      {content}
    </Column>
  );

  return (
    <SafeArea x={0} y={0} style={{ width, height, backgroundColor: '#F3F4F6' }}>
      <ScrollView x={0} y={0} style={{ width, height, padding: p, gap: 24 }}>
        <Text
          text="Skia Kit Example"
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#111827',
          }}
        />

        {renderSection(
          'Buttons Component',
          <Column style={{ width: contentWidth - 32, gap: 8 }}>
            <Row style={{ gap: 8, flexWrap: 'wrap' }}>
              <Button text="Solid" variant="solid" color="primary" />
              <Button text="Outline" variant="outline" color="primary" />
              <Button text="Ghost" variant="ghost" color="primary" />
            </Row>
            <Row style={{ gap: 8, flexWrap: 'wrap' }}>
              <Button text="Success" variant="solid" color="success" />
              <Button text="Error" variant="solid" color="error" />
              <Button text="Warning" variant="solid" color="warning" />
            </Row>
            <Row style={{ gap: 8, flexWrap: 'wrap' }}>
              <Button icon="home" variant="icon" color="primary" />
              <Button
                icon="star"
                text="With Icon"
                variant="solid"
                color="primary"
              />
            </Row>
          </Column>
        )}

        {renderSection(
          'Interactive Modes',
          <Column style={{ width: contentWidth - 32, gap: 16 }}>
            <Row style={{ gap: 8, flexWrap: 'wrap' }}>
              <Button text="Default Ripple" interactive="ripple" color="primary" />
              <Button text="Bounce Effect" interactive="bounce" color="secondary" />
              <Button text="Opacity Effect" interactive="opacity" color="success" />
            </Row>
            <Row style={{ gap: 8, flexWrap: 'wrap' }}>
              <Button text="Custom Ripple" interactive="ripple" rippleColor="rgba(255, 0, 0, 0.4)" color="warning" />
              <Button text="Disabled" disabled />
            </Row>
          </Column>
        )}

        {renderSection(
          'Avatar Component',
          <Row style={{ gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Avatar size={48} variant="circle" color="primary" />
            <Avatar size={48} variant="rounded" color="secondary" />
            <Avatar size={48} variant="square" color="success" />
            <Stack>
              <Avatar size={56} variant="circle" color="warning" />
              <Badge value={3} color="error" x={42} y={0} />
            </Stack>
          </Row>
        )}

        {renderSection(
          'Cards & Lists',
          <Column style={{ width: contentWidth - 32, gap: 16 }}>
            <Card onPress={() => {}} style={{ padding: 16, gap: 8, width: contentWidth - 32 }}>
              <Text text="Interactive Card" style={{ fontSize: 18, fontWeight: 'bold' }} />
              <Text text="This card ripples when tapped. Beautiful, isn't it?" style={{ color: '#6B7280' }} />
            </Card>

            <Column style={{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <ListTile
                title="John Doe"
                subtitle="Software Engineer"
                leading={<Avatar size={40} variant="circle" color="primary" />}
                trailing={<Icon name="chevron-right" size={24} color="#9CA3AF" />}
                onPress={() => {}}
              />
              <Divider style={{ height: 1, backgroundColor: '#E5E7EB' }} />
              <ListTile
                title="Jane Smith"
                subtitle="Product Designer"
                leading={<Avatar size={40} variant="rounded" color="secondary" />}
                trailing={<Switch value={false} onChange={() => {}} />}
                onPress={() => {}}
              />
            </Column>
          </Column>
        )}

        {renderSection(
          'Chips',
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            <Chip label="Primary" variant="solid" color="primary" />
            <Chip label="Outline" variant="outline" color="primary" />
          </Row>
        )}

        {renderSection(
          'Controls',
          <Column style={{ width: contentWidth - 32, gap: 16 }}>
            <Row
              style={{
                alignItems: 'center',
                justifyContent: 'space-between',
                width: contentWidth - 32,
              }}
            >
              <Text text="Switch" style={{ fontSize: 16 }} />
              <Switch value={isOn} onChange={setIsOn} />
            </Row>
            <Divider
              style={{
                width: contentWidth - 32,
                height: 1,
                backgroundColor: '#E5E7EB',
              }}
            />
            <Row
              style={{
                alignItems: 'center',
                justifyContent: 'space-between',
                width: contentWidth - 32,
              }}
            >
              <Text text="Checkbox" style={{ fontSize: 16 }} />
              <Checkbox checked={isChecked} onChange={setIsChecked} />
            </Row>
            <Divider
              style={{
                width: contentWidth - 32,
                height: 1,
                backgroundColor: '#E5E7EB',
              }}
            />
            <Row style={{ gap: 16, alignItems: 'center' }}>
              <Text text="Radio Group:" style={{ fontSize: 16 }} />
              <Radio
                selected={radioVal === '1'}
                onChange={() => setRadioVal('1')}
              />
              <Radio
                selected={radioVal === '2'}
                onChange={() => setRadioVal('2')}
              />
            </Row>
          </Column>
        )}

        {renderSection(
          'Forms & Input',
          <Column style={{ width: contentWidth - 32, gap: 16 }}>
            <Input
              value={textVal}
              onChange={setTextVal}
              placeholder="Type something..."
              style={{ width: contentWidth - 32 }}
            />
            <Slider
              value={sliderVal}
              onChange={setSliderVal}
              min={0}
              max={100}
              style={{ width: contentWidth - 32, height: 40 }}
            />
          </Column>
        )}

        {renderSection(
          'Navigation',
          <Column style={{ width: contentWidth - 32, gap: 16 }}>
            <TabBar
              items={[{ label: 'Home' }, { label: 'Explore' }, { label: 'Settings' }]}
              activeIndex={activeTab}
              onChanged={setActiveTab}
              style={{ width: contentWidth - 32 }}
            />
            <TabBar
              variant="segment"
              items={[{ label: 'Daily' }, { label: 'Weekly' }, { label: 'Monthly' }]}
              activeIndex={activeTab}
              onChanged={setActiveTab}
              style={{ width: contentWidth - 32 }}
            />
            <Box style={{ height: 16 }} />
            <Text text="Bottom Navigation" style={{ fontSize: 16, fontWeight: 'bold' }} />
            <BottomNavigationBar
              items={[
                { label: 'Home', icon: 'home' },
                { label: 'Search', icon: 'search' },
                { label: 'Profile', icon: 'user' }
              ]}
              activeIndex={activeBottomNav}
              onChange={setActiveBottomNav}
              style={{ width: contentWidth - 32, borderRadius: 16 }}
            />
          </Column>
        )}

        {renderSection(
          'Feedback & Progress',
          <Column
            style={{ width: contentWidth - 32, gap: 16, alignItems: 'center' }}
          >
            <Progress
              variant="circular"
              value={sliderVal / 100}
              style={{ width: 48, height: 48 }}
              color={['primary']}
            />
            <Progress
              variant="linear"
              value={sliderVal / 100}
              style={{ width: contentWidth - 32, height: 8 }}
              color={['secondary']}
            />
            <Progress
              variant="circular"
              style={{ width: 48, height: 48 }}
              color={['success']}
            />
            <Progress
              variant="linear"
              style={{ width: contentWidth - 32, height: 8 }}
              color={['warning', 'success']}
            />
          </Column>
        )}

        {/* Fill up space so that the user can scroll fully */}
        <Box style={{ height: 100 }} />
      </ScrollView>
    </SafeArea>
  );
}

export default function App() {
  const { width, height } = useWindowDimensions();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CanvasRoot style={{ width, height }}>
        <UIComponentsGallery />
      </CanvasRoot>
    </GestureHandlerRootView>
  );
}
