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
} from 'react-native-skia-kit';

function UIComponentsGallery() {
  const { width, height } = useWindowDimensions();
  const [isOn, setIsOn] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [radioVal, setRadioVal] = useState('1');
  const [sliderVal, setSliderVal] = useState(50);
  const [textVal, setTextVal] = useState('');

  // Padding & constants
  const p = 16;
  const contentWidth = width - p * 2;

  // A helper to draw a section
  const Section = ({ title, children, x, y, style }: any) => (
    <Column x={x} y={y} style={{ ...style, width: contentWidth, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 24, elevation: 2 }}>
      <Text text={title} style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }} />
      <Divider style={{ width: contentWidth - 32, height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 }} />
      {children}
    </Column>
  );

  return (
    <SafeArea x={0} y={0} style={{ width, height, backgroundColor: '#F3F4F6' }}>
      <ScrollView x={0} y={0} style={{ width, height, padding: p }} contentSize={2200}>
        <Text text="Skia Kit Expo Example" style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 24 }} />

        <Section title="Buttons Component">
          <Column style={{ width: contentWidth - 32, gap: 16 }}>
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
              <Button icon="star" text="With Icon" variant="solid" color="primary" />
            </Row>
          </Column>
        </Section>

        <Section title="Avatar Component">
          <Row style={{ gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Avatar size={48} variant="circle" color="primary" />
            <Avatar size={48} variant="rounded" color="secondary" />
            <Avatar size={48} variant="square" color="success" />
            <Badge value={3} color="error">
              <Avatar size={56} variant="circle" color="warning" />
            </Badge>
          </Row>
        </Section>

        <Section title="Chips">
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
             <Chip label="Primary" variant="solid" color="primary" />
             <Chip label="Outline" variant="outline" color="primary" />
          </Row>
        </Section>

        <Section title="Controls">
          <Column style={{ width: contentWidth - 32, gap: 16 }}>
             <Row style={{ alignItems: 'center', justifyContent: 'space-between', width: contentWidth - 32 }}>
               <Text text="Switch" style={{ fontSize: 16 }} />
               <Switch value={isOn} onChange={setIsOn} />
             </Row>
             <Divider style={{ width: contentWidth - 32, height: 1, backgroundColor: '#E5E7EB' }} />
             <Row style={{ alignItems: 'center', justifyContent: 'space-between', width: contentWidth - 32 }}>
               <Text text="Checkbox" style={{ fontSize: 16 }} />
               <Checkbox checked={isChecked} onChange={setIsChecked} />
             </Row>
             <Divider style={{ width: contentWidth - 32, height: 1, backgroundColor: '#E5E7EB' }} />
             <Row style={{ gap: 16, alignItems: 'center' }}>
               <Text text="Radio Group:" style={{ fontSize: 16 }} />
               <Radio selected={radioVal === '1'} onChange={() => setRadioVal('1')} />
               <Radio selected={radioVal === '2'} onChange={() => setRadioVal('2')} />
             </Row>
          </Column>
        </Section>

        <Section title="Forms & Input">
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
        </Section>

        <Section title="Feedback & Progress">
          <Column style={{ width: contentWidth - 32, gap: 16, alignItems: 'center' }}>
            <Progress variant="circular" value={sliderVal / 100} style={{ width: 48, height: 48 }} colors={['primary']} />
            <Progress variant="linear" value={sliderVal / 100} style={{ width: contentWidth - 32, height: 8 }} colors={['secondary']} />
            <Progress variant="circular" style={{ width: 48, height: 48 }} colors={['success']} />
            <Progress variant="linear" style={{ width: contentWidth - 32, height: 8 }} colors={['warning']} />
          </Column>
        </Section>
        
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
