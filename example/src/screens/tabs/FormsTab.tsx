/**
 * FormsTab — Input, SearchBar, Checkbox, Radio, Switch, Slider, Dropdown, TabBar
 */
import * as React from 'react';
import {
  ScrollView,
  Column,
  Row,
  Box,
  Text,
  Divider,
  Input,
  SearchBar,
  Checkbox,
  Radio,
  Switch,
  Slider,
  DropdownButton,
  TabBar,
  type DropdownItem,
} from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit';
import { SectionHeader } from '../components/SectionHeader';

interface Props {
  width: number;
  height: number;
  display?: 'flex' | 'none';
}

const DROPDOWN_ITEMS: DropdownItem[] = [
  { value: 'react', label: 'React Native', icon: 'code' },
  { value: 'flutter', label: 'Flutter', icon: 'activity' },
  { value: 'swift', label: 'SwiftUI', icon: 'star' },
  { value: 'compose', label: 'Jetpack Compose', icon: 'layers' },
];

const TAB_ITEMS = [
  { label: 'Tab 1', icon: 'home' },
  { label: 'Tab 2', icon: 'bell' },
  { label: 'Tab 3', icon: 'user' },
];

export function FormsTab({ width, height, display = 'flex' }: Props) {
  const theme = useTheme();

  const [inputValue] = React.useState('');
  const [searchValue, setSearchValue] = React.useState('');
  const [checked1, setChecked1] = React.useState(true);
  const [checked2, setChecked2] = React.useState(false);
  const [checked3, setChecked3] = React.useState(false);
  const [selectedRadio, setSelectedRadio] = React.useState(0);
  const [switchA, setSwitchA] = React.useState(true);
  const [switchB, setSwitchB] = React.useState(false);
  const [switchC, setSwitchC] = React.useState(false);
  const [sliderVal, setSliderVal] = React.useState(40);
  const [sliderStep, setSliderStep] = React.useState(25);
  const [dropdownVal, setDropdownVal] = React.useState<string>('react');
  const [activeTab, setActiveTab] = React.useState(0);
  const [activeSegment, setActiveSegment] = React.useState(0);

  return (
    <ScrollView style={{ width, height, display }}>
      <Column style={{ gap: 0 }}>

        {/* ── Input ── */}
        <SectionHeader title="Input" />
        <Column style={{ gap: 12, padding: 16 }}>
          <Input
            value={inputValue}
            placeholder="Outline input (default)"
            variant="outline"
            color="primary"
            style={{ width: width - 32 }}
          />
          <Input
            value={inputValue}
            placeholder="Solid/filled input"
            variant="solid"
            style={{ width: width - 32 }}
          />
          <Input
            value={inputValue}
            placeholder="Underlined input"
            variant="underlined"
            color="secondary"
            style={{ width: width - 32 }}
          />
          <Input
            value="••••••••"
            placeholder="Password"
            secureTextEntry
            style={{ width: width - 32 }}
          />
        </Column>

        <Divider style={{ length: width - 32 }} />

        {/* ── SearchBar ── */}
        <SectionHeader title="SearchBar" />
        <Box style={{ padding: 16 }}>
          <SearchBar
            value={searchValue}
            placeholder="Tìm kiếm component..."
            style={{ width: width - 32 }}
            onChanged={setSearchValue}
          />
        </Box>

        <Divider style={{ length: width - 32 }} />

        {/* ── Checkbox ── */}
        <SectionHeader title="Checkbox" />
        <Column style={{ gap: 4, padding: 16 }}>
          <Row style={{ gap: 16, alignItems: 'center' }}>
            <Checkbox
              checked={checked1}
              color="primary"
              onChange={setChecked1}
            />
            <Text text="Primary (checked)" style={{ fontSize: 14, color: theme.colors.textBody }} />
          </Row>
          <Row style={{ gap: 16, alignItems: 'center' }}>
            <Checkbox
              checked={checked2}
              color="secondary"
              onChange={setChecked2}
            />
            <Text text="Secondary (unchecked)" style={{ fontSize: 14, color: theme.colors.textBody }} />
          </Row>
          <Row style={{ gap: 16, alignItems: 'center' }}>
            <Checkbox
              checked={checked3}
              color="success"
              onChange={setChecked3}
            />
            <Text text="Success" style={{ fontSize: 14, color: theme.colors.textBody }} />
          </Row>
          <Row style={{ gap: 16, alignItems: 'center' }}>
            <Checkbox checked disabled color="primary" />
            <Text text="Disabled (checked)" style={{ fontSize: 14, color: theme.colors.textDisabled }} />
          </Row>
          <Row style={{ gap: 16, alignItems: 'center' }}>
            <Checkbox disabled color="primary" />
            <Text text="Disabled (unchecked)" style={{ fontSize: 14, color: theme.colors.textDisabled }} />
          </Row>
        </Column>

        <Divider style={{ length: width - 32 }} />

        {/* ── Radio ── */}
        <SectionHeader title="Radio" />
        <Column style={{ gap: 4, padding: 16 }}>
          {['Option A', 'Option B', 'Option C'].map((label, i) => (
            <Row key={i} style={{ gap: 16, alignItems: 'center' }}>
              <Radio
                selected={selectedRadio === i}
                color="primary"
                onChange={() => setSelectedRadio(i)}
              />
              <Text
                text={label}
                style={{ fontSize: 14, color: theme.colors.textBody }}
              />
            </Row>
          ))}
          <Row style={{ gap: 16, alignItems: 'center' }}>
            <Radio selected disabled color="primary" />
            <Text text="Disabled selected" style={{ fontSize: 14, color: theme.colors.textDisabled }} />
          </Row>
        </Column>

        <Divider style={{ length: width - 32 }} />

        {/* ── Switch ── */}
        <SectionHeader title="Switch" />
        <Column style={{ gap: 4, padding: 16 }}>
          <Row style={{ gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <Text text="Notifications" style={{ fontSize: 14, color: theme.colors.textBody }} />
            <Switch value={switchA} color="primary" onChange={setSwitchA} />
          </Row>
          <Row style={{ gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <Text text="Dark Mode" style={{ fontSize: 14, color: theme.colors.textBody }} />
            <Switch value={switchB} color="secondary" onChange={setSwitchB} />
          </Row>
          <Row style={{ gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <Text text="Auto-Update (disabled)" style={{ fontSize: 14, color: theme.colors.textDisabled }} />
            <Switch value={switchC} disabled onChange={setSwitchC} />
          </Row>
        </Column>

        <Divider style={{ length: width - 32 }} />

        {/* ── Slider ── */}
        <SectionHeader title="Slider" />
        <Column style={{ gap: 16, padding: 16 }}>
          <Column style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text text="Continuous" style={{ fontSize: 13, color: theme.colors.textSecondary }} />
              <Text text={`${sliderVal}`} style={{ fontSize: 13, color: theme.colors.primary }} />
            </Row>
            <Slider
              min={0} max={100}
              value={sliderVal}
              color="primary"
              style={{ width: width - 32 }}
              onChange={setSliderVal}
            />
          </Column>
          <Column style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text text="Step=25" style={{ fontSize: 13, color: theme.colors.textSecondary }} />
              <Text text={`${sliderStep}`} style={{ fontSize: 13, color: theme.colors.secondary }} />
            </Row>
            <Slider
              min={0} max={100} step={25}
              value={sliderStep}
              color="secondary"
              style={{ width: width - 32 }}
              onChange={setSliderStep}
            />
          </Column>
          <Slider min={0} max={100} value={60} disabled style={{ width: width - 32 }} />
        </Column>

        <Divider style={{ length: width - 32 }} />

        {/* ── Dropdown ── */}
        <SectionHeader title="DropdownButton" />
        <Box style={{ padding: 16 }}>
          <DropdownButton
            items={DROPDOWN_ITEMS}
            value={dropdownVal}
            onChanged={(v) => setDropdownVal(v)}
            style={{ width: width - 32 }}
          />
        </Box>

        <Divider style={{ length: width - 32 }} />

        {/* ── TabBar ── */}
        <SectionHeader title="TabBar" />
        <Column style={{ gap: 12, padding: 16 }}>
          <TabBar
            items={TAB_ITEMS}
            activeIndex={activeTab}
            onChanged={setActiveTab}
            variant="tab"
            style={{ width: width - 32 }}
          />
          <TabBar
            items={TAB_ITEMS}
            activeIndex={activeSegment}
            onChanged={setActiveSegment}
            variant="segment"
            style={{ width: width - 32 }}
          />
        </Column>

        {/* Bottom padding */}
        <Box style={{ height: 24 }} />
      </Column>
    </ScrollView>
  );
}
