import React, {useEffect, useMemo, useRef, useState} from 'react';
import styled from 'styled-components';
import {NavTabs} from '../components/NavTabs';
import {DeviceHeader} from '../components/DeviceHeader';
import {useKeyboardStore} from '../store/keyboard';
import {hsvToHex, hexToHsv} from '../utils/color';
import {parseLightingMenus, findItem} from '../utils/lighting';
import type {LightingZone} from '../utils/lighting';
import keyMatrixLight from '../assets/nuphy/light/key-matrix-light.webp';
import keyMatrixLightCheck from '../assets/nuphy/light/key-matrix-light-check.webp';
import lightSprite from '../assets/nuphy/icons/light-symbols.svg?url';

// ============================================================
// 灯效设置 — 复刻原版 selectDevice=5 灯效页结构
// 分区tab(背光灯/条形灯)+ 效果宫格 + 亮度%(0-100) + 颜色预设/最近使用
// 数据来自 VIA 定义 JSON menus(QMK RGB Matrix,channel 3)
// ============================================================

const Page = styled.div`
  width: 100%;
  max-width: none;
  margin: 0 auto;
  padding: 0 1.9rem 0.5rem;
`;

const PageNav = styled.div`
  position: fixed;
  z-index: 11;
  left: 2.05rem;
  right: 2.05rem;
  bottom: 23.25rem;
  height: 1.875rem;
`;

const Card = styled.div`
  position: fixed;
  left: 2.05rem;
  right: 2.05rem;
  bottom: 0.5rem;
  background: var(--surface-page);
  border-radius: 1.5rem;
  padding: .5rem;
  box-shadow: 0 2px 8px var(--black-4);
  display: flex;
  gap: .5rem;
  height: 23.25rem;
  box-sizing: border-box;
  overflow: hidden;
`;

// === 分区 tab(原版 lightTypeItem) ===
const ZoneTabs = styled.div`
  display: flex;
  flex: 0 0 17.3125rem;
  flex-direction: column;
  gap: .5rem;
  box-sizing: border-box;
  padding: .5rem;
  background: var(--surface-card);
  border-radius: 1rem;
`;

const ZoneTab = styled.button<{$active: boolean; $disabled?: boolean}>`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: .5rem;
  justify-content: center;
  width: 100%;
  flex: 0 0 9.8125rem;
  min-height: 0;
  padding: .5rem;
  box-sizing: border-box;
  border-radius: .75rem;
  background: ${(p) => (p.$active ? 'var(--button-active-background)' : 'transparent')};
  border: 0;
  transition: all 0.15s ease;
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.$disabled ? .52 : 1)};
  &:hover {
    background: ${(p) => (p.$disabled ? 'transparent' : p.$active ? 'var(--button-active-background)' : 'var(--button-black-xs-min)')};
  }
  img {
    width: 100%;
    height: 6.125rem;
    object-fit: cover;
  }
`;

const ZoneDetail = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
`;

const ZoneText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .125rem;
  flex: 1;
  min-width: 0;
`;

const ZoneLabel = styled.span<{$active: boolean}>`
  font-size: 0.75rem;
  font-weight: 700;
  line-height: normal;
  white-space: nowrap;
  color: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--text-primary)')};
`;

const ZoneDescription = styled.span<{$active: boolean}>`
  font-size: .75rem;
  font-weight: 500;
  line-height: normal;
  white-space: nowrap;
  color: ${(p) => (p.$active ? 'var(--text-white-s-content)' : 'var(--text-secondary)')};
`;

const ZoneSwitch = styled.span<{$on: boolean}>`
  display: block;
  flex: none;
  width: 3.125rem;
  height: 1.875rem;
  padding: .125rem;
  box-sizing: border-box;
  border-radius: 5rem;
  background: ${(p) => (p.$on ? 'var(--other-switch-on)' : 'var(--other-switch-off)')};
  transition: background .15s ease;
  &::after {
    content: '';
    display: block;
    width: 1.625rem;
    height: 1.625rem;
    border-radius: 50%;
    background: var(--other-switch-circle);
    transform: ${(p) => (p.$on ? 'translateX(1.375rem)' : 'translateX(0)')};
    transition: transform .15s ease;
  }
`;

const SectionHeader = styled.div`
  height: 1.23rem;
  flex: 0 1 auto;
  font-size: 0.875rem;
  font-weight: 900;
  line-height: normal;
  color: var(--text-black-l-title);
  padding: 0;
`;

const MiddlePanel = styled.div`
  display: flex;
  flex: 0 0 40.3125rem;
  min-width: 0;
  flex-direction: column;
  gap: .5rem;
  box-sizing: border-box;
  padding: .25rem .5rem .5rem;
  background: var(--surface-card);
  border-radius: 1rem;
`;

const MiddleControls = styled.div`
  display: flex;
  flex: 1 0 0;
  min-height: 0;
  gap: .5rem;
`;

// === 效果宫格(原版 lightTypeItem 网格) ===
const EffectGrid = styled.div`
  flex: 0 0 19.25rem;
  width: 19.25rem;
  height: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: 3.5rem;
  gap: .5rem;
  background: var(--surface-quiet);
  border-radius: .75rem;
  padding: .5rem;
  align-content: start;
  overflow-y: auto;
`;

const EffectItem = styled.button<{$active: boolean}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .25rem;
  width: 100%;
  height: 100%;
  padding: .125rem;
  box-sizing: border-box;
  border-radius: .375rem;
  background: ${(p) => (p.$active ? 'var(--button-active-background)' : 'transparent')};
  border: 0;
  transition: all 0.1s ease;
  cursor: pointer;
  color: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--text-primary)')};
  &:hover {
    border-color: var(--theme-color);
  }
`;

const EffectDot = styled.span<{$active: boolean}>`
  width: 1.5rem;
  height: 1.5rem;
  display: block;
  color: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--text-primary)')};
  opacity: ${(p) => (p.$active ? 1 : .72)};
  svg { width: 100%; height: 100%; fill: currentColor; }
`;

const EffectName = styled.span<{$active: boolean}>`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--text-primary)')};
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
`;

// === 原版 lightConfigSettingCard 滑块 ===
const ConfigColumn = styled.div`
  display: flex;
  flex: 0 0 19.625rem;
  width: 19.625rem;
  min-width: 0;
  flex-direction: column;
  gap: .5rem;
`;

const SliderCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: .5rem;
  width: 100%;
  flex: 0 0 6.765625rem;
  height: 6.765625rem;
  box-sizing: border-box;
  padding: .5rem;
  border-radius: .75rem;
  background: var(--surface-quiet);
`;

const DropdownCard = styled(SliderCard)`
  justify-content: space-between;
`;

const SettingSelect = styled.select`
  width: 100%;
  height: 2.25rem;
  box-sizing: border-box;
  padding: 0 .625rem;
  border: 0;
  border-radius: .5rem;
  outline: none;
  color: var(--text-primary);
  background: var(--slider-background);
  font: inherit;
  font-size: .75rem;
  cursor: pointer;
`;

const SettingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 1.03rem;
  color: var(--text-primary);
`;

const SettingTitle = styled.span`
  font-size: .75rem;
  font-weight: 700;
  line-height: normal;
`;

const SettingValue = styled.span`
  font-size: .75rem;
  font-weight: 500;
  line-height: normal;
`;

const SliderArea = styled.div`
  width: 100%;
  padding-top: .875rem;
`;

const SliderScale = styled.div<{$ticks: number}>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$ticks}, 1fr);
  width: 100%;
  height: .3125rem;
  padding: 0 .5rem;
  box-sizing: border-box;
`;

const SliderTick = styled.span<{$label?: string}>`
  position: relative;
  display: flex;
  justify-content: center;
  height: .3125rem;
  &::before {
    content: '';
    display: block;
    width: .09375rem;
    height: 100%;
    border-radius: .0625rem;
    background: var(--black-16);
  }
  &::after {
    content: '${(p) => p.$label ?? ''}';
    position: absolute;
    top: -.9375rem;
    left: 50%;
    transform: translateX(-50%);
    color: var(--text-secondary);
    font-size: .75rem;
    font-weight: 700;
    white-space: nowrap;
  }
`;

const SliderOuter = styled.div`
  position: relative;
  width: 100%;
  height: 2.25rem;
  margin: .25rem 0;
  box-sizing: border-box;
  border: .125rem solid var(--slider-border);
  border-radius: .5rem;
  background: var(--slider-background);
`;

const SliderTrack = styled.div`
  position: absolute;
  inset: 0;
  height: 100%;
  box-sizing: border-box;
  padding: 0 .375rem;
  border-radius: .375rem;
  background: var(--slider-track);
  overflow: hidden;
`;

const SliderProgress = styled.div<{$ratio: number}>`
  position: absolute;
  left: .375rem;
  top: 0;
  width: ${(p) => `calc(${p.$ratio * 100}% - ${p.$ratio * .75}rem)`};
  height: 100%;
  border-radius: .375rem 0 0 .375rem;
  background: var(--slider-progress);
`;

const SliderThumb = styled.div<{$ratio: number}>`
  position: absolute;
  z-index: 2;
  left: ${(p) => `calc(.375rem + ${p.$ratio * 100}% - ${p.$ratio * .75}rem)`};
  top: 50%;
  width: 1rem;
  height: 2.2rem;
  box-sizing: border-box;
  transform: translate(-50%, -50%);
  border: 0;
  border-radius: .36rem;
  background: var(--slider-progress);
  box-shadow: 0 .125rem .25rem rgba(0, 0, 0, .1);
  pointer-events: none;
`;

const SliderInput = styled.input`
  position: absolute;
  z-index: 3;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
`;

const DirectionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: .5rem;
  width: 100%;
  flex: 0 0 5.28125rem;
  height: 5.28125rem;
  box-sizing: border-box;
  padding: .5rem;
  border-radius: .75rem;
  background: var(--surface-quiet);
`;

const DirectionOptions = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  height: 2.75rem;
  margin-top: .5rem;
`;

const DirectionOption = styled.button<{$active: boolean}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 0;
  border-radius: .375rem;
  color: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--text-primary)')};
  background: ${(p) => (p.$active ? 'var(--button-active-background)' : 'transparent')};
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
`;

// === 颜色 ===
const ColorPanel = styled.div`
  display: flex;
  flex: 1 0 0;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: .25rem;
  box-sizing: border-box;
  padding: .25rem .5rem .5rem;
  background: var(--surface-card);
  border-radius: 1rem;
`;

const ColorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 1.875rem;
  flex: 0 1 auto;
`;

const ColorSwitchButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  &:focus-visible {
    outline: 1px solid var(--theme-color);
    outline-offset: .125rem;
    border-radius: 5rem;
  }
`;

const ColorTitle = styled.span`
  font-size: .875rem;
  font-weight: 900;
  line-height: normal;
  color: var(--text-black-l-title);
`;

const ColorContent = styled.div<{$disabled?: boolean}>`
  display: flex;
  flex: 1 0 0;
  min-height: 0;
  gap: .5rem;
  opacity: ${(p) => (p.$disabled ? .42 : 1)};
  pointer-events: ${(p) => (p.$disabled ? 'none' : 'auto')};
  transition: opacity .15s ease;
`;

const ColorPickerColumn = styled.div`
  display: flex;
  flex: 0 0 15.625rem;
  height: 19.58rem;
  min-width: 0;
  flex-direction: column;
  gap: .5rem;
`;

const PresetColumn = styled.div`
  display: flex;
  flex: 1 0 0;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: .5rem;
`;

const PresetCard = styled.div`
  display: flex;
  flex: 1 0 0;
  min-height: 0;
  flex-direction: column;
  gap: .5rem;
  box-sizing: border-box;
  padding: .5rem;
  background: var(--button-black-xs-min);
  border-radius: .75rem;
  overflow: auto;
`;

const ColorInputRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: .5rem;
  width: 100%;
  height: 2.25rem;
  flex: 0 0 2.25rem;
`;

const ColorWheel = styled.div<{$hue: number}>`
  position: relative;
  flex: 0 0 14.125rem;
  width: 15.625rem;
  height: 14.125rem;
  box-sizing: border-box;
  border: 1px solid var(--color-picker-wheel-border);
  border-radius: 1.1rem;
  background:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, transparent),
    hsl(${(p) => p.$hue}, 100%, 50%);
`;

const HueBar = styled.div`
  position: relative;
  flex: 0 0 2.2rem;
  width: 15.625rem;
  height: 2.2rem;
  margin-top: 0;
  border-radius: .75rem;
  border: 1px solid var(--color-picker-wheel-border);
  box-sizing: border-box;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);
  }
`;

const PickerHandle = styled.span<{$x: number; $y: number; $color: string}>`
  position: absolute;
  left: ${(p) => `${p.$x * 100}%`};
  top: ${(p) => `${p.$y * 100}%`};
  width: 1.25rem;
  height: 1.25rem;
  box-sizing: border-box;
  border: 2px solid #000;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  background: ${(p) => p.$color};
  box-shadow: inset 0 0 0 2px #fff;
`;

const HueHandle = styled.span<{$x: number; $color: string}>`
  position: absolute;
  z-index: 1;
  left: ${(p) => `${p.$x * 100}%`};
  top: 50%;
  width: 1.25rem;
  height: 1.25rem;
  box-sizing: border-box;
  border: 2px solid #000;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  background: ${(p) => p.$color};
  box-shadow: inset 0 0 0 2px #fff;
`;

const ColorInput = styled.input`
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  border: none;
  border-radius: var(--border-radius-xs);
  cursor: pointer;
  &::-webkit-color-swatch {
    border-radius: 4px;
    border: 1px solid var(--black-12);
  }
`;

const HexInput = styled.input`
  flex: 1;
  width: auto;
  min-width: 0;
  box-sizing: border-box;
  border: 0;
  border-radius: .75rem;
  padding: .25rem .6875rem;
  font-size: .75rem;
  font-family: 'SF Mono', Menlo, monospace;
  color: var(--text-black-l-title);
  background: var(--button-black-xs-min);
  outline: none;
  &:focus {
    border-color: var(--theme-color);
  }
`;

const ColorLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-black-s-content);
`;

const Swatches = styled.div`
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
`;

const Swatch = styled.button<{$active?: boolean}>`
  width: 2rem;
  height: 2rem;
  padding: 0;
  border-radius: .75rem;
  border: 1px solid var(--white-100);
  box-shadow: ${(p) => (p.$active ? '0 0 0 1px var(--theme-color)' : 'none')};
  cursor: pointer;
`;

const PRESET_COLORS = [
  '#ff7526', '#fff029', '#65e5b1', '#438ceb', '#8277df',
  '#d948a5', '#ed3434', '#f8c23c', '#71d7e4', '#5be94d', '#3735dc', '#db42d2',
];

// 顺序必须与 VIA JSON 的 Effect options 一一对应。不能按视觉图标顺序
// 截断或重排，否则写回设备的 effect id 会与面板名称错位。
const EFFECT_LABELS = [
  '关闭灯光', '静态颜色', '上下渐变', '左右渐变', '呼吸',
  '饱和度波浪', '明度波浪', '饱和度旋转', '明度旋转', '饱和度螺旋',
  '明度螺旋', '循环', '左右循环', '上下循环', '彩虹移动',
  '内外循环', '双向内外循环', '旋转循环', '螺旋循环', '双灯塔',
  '彩虹灯塔', '彩虹旋转', '雨滴', '彩色雨滴', '色相呼吸',
  '色相摆动', '色相波浪', '打字热力图', '数字雨', '响应单点',
  '响应波纹', '响应宽波纹', '响应多宽波纹', '响应十字', '响应多十字',
  '响应中心', '响应多中心', '溅射', '多重溅射', '单色溅射',
  '多色溅射', '游戏模式', '定位模式',
];

// JSON menus 里的英文标签 → 原版中文
const LABEL_MAP: Record<string, string> = {
  Backlight: '背光灯',
  'Side Light': '条型灯',
  Brightness: '亮度',
  Effect: '效果',
  Mode: '模式',
  'Effect Speed': '变换速度',
  'Speed (higher is slower)': '变换速度',
  Direction: '变换方向',
  Color: '颜色',
  'Static Color': '静态颜色',
  'Strip Light': '条形灯',
};
const tLabel = (s: string): string => LABEL_MAP[s] ?? s;

// Halo V2 stock firmware advertises the side-light functions as custom
// keycodes, not as VIA menus. Keep this candidate definition local to this
// page so VIA's generic menu loader never probes unsupported commands.
const SIDE_LIGHT_ZONE: LightingZone = {
  label: 'Side Light',
  items: [
    {
      id: 'id_side_light_mode', label: 'Mode', type: 'dropdown', options: ['Wave', 'Mix', 'Static', 'Breath', 'Off'], channel: 0, command: 10,
    },
    {
      id: 'id_side_light_speed', label: 'Speed (higher is slower)', type: 'dropdown', options: ['1', '2', '3', '4', '5'], channel: 0, command: 11, showIf: '{id_side_light_mode} != 4',
    },
    {
      id: 'id_side_light_static_color', label: 'Static Color', type: 'color', channel: 0, command: 14, showIf: '{id_side_light_mode} == 0 || {id_side_light_mode} == 2 || {id_side_light_mode} == 3',
    },
    {
      id: 'id_side_light_brightness', label: 'Brightness', type: 'range', options: ['0', '5'], channel: 0, command: 13, showIf: '{id_side_light_mode} != 4',
    },
  ],
};

const RECENT_KEY = 'nuphy-recent-colors';
const readRecent = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(v) ? v.slice(0, 8) : [];
  } catch {
    return [];
  }
};

// QMK hue 0-255 ↔ 角度 0-360
const hueToDeg = (h: number) => Math.round((h * 360) / 255);
const degToHue = (deg: number) => Math.round((deg * 255) / 360);

type NumericRange = {min: number; max: number};

const rangeFromItem = (item: LightingZone['items'][number] | undefined, fallback: NumericRange): NumericRange => {
  const values = item?.options?.map(Number).filter(Number.isFinite) ?? [];
  if (values.length < 2 || values[0] === values[1]) return fallback;
  return {min: Math.min(values[0], values[1]), max: Math.max(values[0], values[1])};
};

const clampToRange = (value: number, range: NumericRange): number =>
  Math.min(range.max, Math.max(range.min, value));

const rangeRatio = (value: number, range: NumericRange): number =>
  (range.max - range.min) === 0 ? 0 : (value - range.min) / (range.max - range.min);

const showIfMatches = (item: LightingZone['items'][number] | undefined, values: Record<string, number>): boolean => {
  if (!item?.showIf) return true;
  const evaluate = (expression: string): boolean | undefined => {
    const match = /^\{([^}]+)\}\s*(==|!=)\s*(-?\d+(?:\.\d+)?)$/.exec(expression.trim());
    if (!match) return undefined;
    const current = values[match[1]];
    if (current === undefined) return undefined;
    const expected = Number(match[3]);
    return match[2] === '==' ? current === expected : current !== expected;
  };
  const orGroups = item.showIf.split(/\s*\|\|\s*/);
  let hasUnknown = false;
  for (const group of orGroups) {
    const andResults = group.split(/\s*&&\s*/).map(evaluate);
    if (andResults.some((result) => result === true)) return true;
    if (andResults.some((result) => result === undefined)) hasUnknown = true;
    if (andResults.every((result) => result === false)) continue;
  }
  return hasUnknown;
};

const directionGlyph = (label: string, index: number): string => {
  if (/left|左|←/i.test(label)) return '←';
  if (/right|右|→/i.test(label)) return '→';
  return index === 0 ? '←' : '→';
};

export const LightingPage: React.FC = () => {
  const {mode, api, definition, initDemo} = useKeyboardStore();
  const zones = useMemo(() => {
    const parsed = parseLightingMenus(definition);
    const hasSideLightKeycodes = Boolean(definition?.customKeycodes?.some((item) => /side\s*(light|mode|color|fast|slow)/i.test(item.title ?? item.name)));
    return hasSideLightKeycodes ? [...parsed, SIDE_LIGHT_ZONE] : parsed;
  }, [definition]);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [speed, setSpeed] = useState(128);
  const [effect, setEffect] = useState(0);
  const [directionIndex, setDirectionIndex] = useState(1);
  const [color, setColor] = useState('#d9d9d9');
  const [hexText, setHexText] = useState('#d9d9d9');
  const initialHsv = hexToHsv('#d9d9d9');
  const [pickerHue, setPickerHue] = useState(initialHsv.h);
  const [pickerSat, setPickerSat] = useState(initialHsv.s / 255);
  const [pickerValue, setPickerValue] = useState(initialHsv.v / 255);
  const [recent, setRecent] = useState<string[]>(readRecent());
  const [customColorEnabled, setCustomColorEnabled] = useState(true);
  const colorCommitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousEffect = useRef<Record<number, number>>({});
  const zoneEffects = useRef<Record<number, number>>({});

  const zone: LightingZone | undefined = zones[zoneIdx];
  const effectItem = zone ? findItem(zone, 'dropdown') : undefined;
  const brightnessItem = zone ? findItem(zone, 'range', 'Brightness') : undefined;
  const speedItem = zone?.items.find((item) => /speed|速度/i.test(item.label));
  const directionItem = zone ? zone.items.find((item) => /direction|方向/i.test(item.label)) : undefined;
  const colorItem = zone ? findItem(zone, 'color') : undefined;
  const isSideLight = /side light|条型灯|条形灯/i.test(zone?.label ?? '');
  const colorWheelRef = useRef<HTMLDivElement>(null);
  const hueBarRef = useRef<HTMLDivElement>(null);
  const effectChoices = (effectItem?.options ?? []).map((name, sourceIndex) => ({
    sourceIndex,
    name: isSideLight ? (['波浪', '混合', '静态颜色', '呼吸', '关闭灯光'][sourceIndex] ?? name) : (EFFECT_LABELS[sourceIndex] ?? name),
  }));
  const effectValue = effectChoices[effect]?.sourceIndex ?? effect;
  const offEffectValue = effectChoices.find(({name}) => /all off|off|关闭灯光/i.test(name))?.sourceIndex ?? 0;
  const showIfValues = effectItem ? {[effectItem.id]: effectValue} : {};
  const showSpeed = Boolean(speedItem && showIfMatches(speedItem, showIfValues));
  const showBrightness = Boolean(brightnessItem && showIfMatches(brightnessItem, showIfValues));
  const showDirection = Boolean(directionItem && showIfMatches(directionItem, showIfValues));
  const showColor = Boolean(colorItem && showIfMatches(colorItem, showIfValues));
  const speedOptions = speedItem?.type === 'dropdown' ? (speedItem.options ?? []) : [];
  const speedRange = speedItem?.type === 'dropdown'
    ? {min: 0, max: Math.max(0, speedOptions.length - 1)}
    : rangeFromItem(speedItem, {min: 0, max: 255});
  const brightnessRange = rangeFromItem(brightnessItem, {min: 0, max: 255});
  const speedValue = clampToRange(speed, speedRange);
  const brightnessValue = clampToRange(brightness, brightnessRange);
  const directionOptions = directionItem?.options?.length
    ? directionItem.options
    : ['left', 'right'];

  useEffect(() => {
    if (effectChoices.length && effect >= effectChoices.length) setEffect(0);
  }, [effectChoices.length, effect]);

  useEffect(() => {
    if (mode === 'disconnected') initDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === 'connected' && api && zone) {
      (async () => {
        try {
          if (brightnessItem) {
            const res = await api.getCustomMenuValue([brightnessItem.channel, brightnessItem.command]);
            if (res[0] !== undefined) setBrightness(res[0]);
          }
          if (speedItem) {
            const res = await api.getCustomMenuValue([speedItem.channel, speedItem.command]);
            if (res[0] !== undefined) setSpeed(res[0]);
          }
          if (effectItem) {
            const res = await api.getCustomMenuValue([effectItem.channel, effectItem.command]);
            if (res[0] !== undefined) {
              setEffect(res[0]);
              zoneEffects.current[zoneIdx] = res[0];
            }
          }
          if (directionItem) {
            const res = await api.getCustomMenuValue([directionItem.channel, directionItem.command]);
            if (res[0] !== undefined) setDirectionIndex(res[0]);
          }
          if (colorItem) {
            const res = await api.getCustomMenuValue([colorItem.channel, colorItem.command]);
            if (res[0] !== undefined && res[1] !== undefined) {
              const hex = hsvToHex(hueToDeg(res[0]), res[1], 255);
              setColor(hex);
              setHexText(hex);
              const hsv = hexToHsv(hex);
              setPickerHue(hsv.h);
              setPickerSat(hsv.s / 255);
              setPickerValue(hsv.v / 255);
            }
          }
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, api, zoneIdx]);

  useEffect(() => () => {
    if (colorCommitTimer.current) clearTimeout(colorCommitTimer.current);
  }, []);

  const write = async (item: {channel: number; command: number}, ...vals: number[]) => {
    if (mode === 'connected' && api) {
      try {
        await api.setCustomMenuValue(item.channel, item.command, ...vals);
      } catch {}
    }
  };

  const updateColorPreview = (hex: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    setColor(hex);
    setHexText(hex);
    const {h, s, v} = hexToHsv(hex);
    setPickerHue(h);
    setPickerSat(s / 255);
    setPickerValue(v / 255);
  };

  const commitColor = (hex: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    updateColorPreview(hex);
    // QMK RGB Matrix 的 color 菜单只有 H/S 两个字节；V 不在这里写，
    // 而是由同一个区域的 Brightness 菜单单独控制。
    if (colorItem && customColorEnabled) {
      const {h, s} = hexToHsv(hex);
      void write(colorItem, degToHue(h), s);
    }
    const next = [hex, ...recent.filter((c) => c !== hex)].slice(0, 8);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  };

  const scheduleColorCommit = (hex: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    if (colorCommitTimer.current) clearTimeout(colorCommitTimer.current);
    colorCommitTimer.current = setTimeout(() => {
      colorCommitTimer.current = null;
      if (customColorEnabled) commitColor(hex);
    }, 1500);
  };

  const toggleCustomColor = () => {
    if (colorCommitTimer.current) {
      clearTimeout(colorCommitTimer.current);
      colorCommitTimer.current = null;
    }
    const next = !customColorEnabled;
    setCustomColorEnabled(next);
    if (next) {
      // 开启时重新写入当前颜色。
      if (colorItem) {
        const {h, s} = hexToHsv(color);
        void write(colorItem, degToHue(h), s);
      }
      if (effectItem) void write(effectItem, effectValue);
      return;
    }

    // VIA JSON 只有 Color(H/S) 菜单，没有“自定义颜色启用”这个固件字段。
    // 因此关闭开关不能只重写 Effect：固件仍会沿用刚才写入的饱和度，
    // 当用户之前选过白色/低饱和色时，彩虹类效果就会退化成单色。
    // 用 QMK RGB Matrix 的全饱和基准色清掉这个覆盖值，再重新应用当前效果，
    // 让效果自身重新接管色相变化；这里不改 UI 中保存的自定义色，重新开启时可恢复。
    void (async () => {
      if (colorItem) await write(colorItem, 0, 255);
      if (effectItem) await write(effectItem, effectValue);
    })();
  };

  const pickColorSquare = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    setPickerSat(x);
    setPickerValue(1 - y);
    const nextColor = hsvToHex(pickerHue, Math.round(x * 255), Math.round((1 - y) * 255));
    updateColorPreview(nextColor);
    scheduleColorCommit(nextColor);
  };

  const pickHue = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const nextHue = Math.round(x * 360);
    setPickerHue(nextHue);
    const nextColor = hsvToHex(nextHue, Math.round(pickerSat * 255), Math.round(pickerValue * 255));
    updateColorPreview(nextColor);
    scheduleColorCommit(nextColor);
  };

  const setEffectValue = (next: number) => {
    if (!effectItem) return;
    if (next !== offEffectValue) previousEffect.current[zoneIdx] = next;
    zoneEffects.current[zoneIdx] = next;
    setEffect(next);
    void write(effectItem, next);
  };

  const toggleZone = () => {
    if (!effectItem) return;
    const firstEnabled = effectChoices.find(({sourceIndex}) => sourceIndex !== offEffectValue)?.sourceIndex ?? 0;
    const next = effectValue === offEffectValue
      ? (previousEffect.current[zoneIdx] ?? firstEnabled)
      : offEffectValue;
    setEffectValue(next);
  };

  if (zones.length === 0) {
    return (
      <Page>
        <DeviceHeader showControls={false} />
        <PageNav><NavTabs /></PageNav>
        <Card>
          <p style={{fontSize: '0.75rem', color: 'var(--text-black-s-content)'}}>
            当前型号未定义灯效菜单。
          </p>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <DeviceHeader showControls={false} />
      <PageNav><NavTabs /></PageNav>
      <Card>
        <ZoneTabs>
          {zones.map((z, i) => {
            const sideLightDisabled = /side light|条型灯|条形灯/i.test(z.label);
            const zoneEffect = zoneEffects.current[i] ?? (i === zoneIdx ? effectValue : 0);
            const zoneOffValue = findItem(z, 'dropdown')?.options?.findIndex((option) => /all off|off|关闭灯光/i.test(option)) ?? 0;
            const zoneOn = zoneEffect !== zoneOffValue;
            return (
            <ZoneTab
              key={z.label}
              $active={i === zoneIdx}
              $disabled={sideLightDisabled}
              aria-disabled={sideLightDisabled}
              title={`切换到${tLabel(z.label)}设置`}
              onClick={() => {
                if (!sideLightDisabled) setZoneIdx(i);
              }}
              >
                <img
                src={
                  i === zoneIdx
                    ? keyMatrixLightCheck
                    : keyMatrixLight
                }
                alt=""
                />
              <ZoneDetail>
                <ZoneText>
                  <ZoneLabel $active={i === zoneIdx}>{tLabel(z.label)}设置</ZoneLabel>
                  <ZoneDescription $active={i === zoneIdx}>
                    {sideLightDisabled ? 'VIA暂无法支持' : `设置键盘的${tLabel(z.label)}效果`}
                  </ZoneDescription>
                </ZoneText>
                <span
                  role="switch"
                  aria-checked={zoneOn}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (i === zoneIdx) toggleZone();
                  }}
                >
                  <ZoneSwitch $on={zoneOn} />
                </span>
              </ZoneDetail>
            </ZoneTab>
            );
          })}
        </ZoneTabs>

        <MiddlePanel>
        <SectionHeader>灯光设置</SectionHeader>
        <MiddleControls>

        {effectItem && effectItem.options && (
          <EffectGrid>
            {effectChoices.filter(({sourceIndex}) => sourceIndex !== offEffectValue).map(({sourceIndex, name}) => (
              <EffectItem
                key={`${name}-${sourceIndex}`}
                $active={sourceIndex === effectValue}
                title={`${name}：${effectItem.options?.[sourceIndex] ?? name}`}
                onClick={() => {
                  setEffectValue(sourceIndex);
                }}
              >
                <EffectDot $active={sourceIndex === effectValue}>
                  <svg viewBox="0 0 25 24" aria-hidden="true"><use href={`${lightSprite}#lightType${sourceIndex}`} /></svg>
                </EffectDot>
                <EffectName $active={sourceIndex === effectValue}>{name}</EffectName>
              </EffectItem>
            ))}
          </EffectGrid>
        )}

        <ConfigColumn>
        {showSpeed && speedItem?.type === 'dropdown' && (
          <DropdownCard>
            <SettingHeader>
              <SettingTitle>{tLabel(speedItem.label)}</SettingTitle>
              <SettingValue>{speedOptions[speedValue] ?? speedValue}</SettingValue>
            </SettingHeader>
            <SettingSelect
              aria-label={tLabel(speedItem.label)}
              value={speedValue}
              onChange={(event) => {
                const value = Number(event.target.value);
                setSpeed(value);
                write(speedItem, value);
              }}
            >
              {speedOptions.map((option, index) => <option key={`${option}-${index}`} value={index}>{option}</option>)}
            </SettingSelect>
          </DropdownCard>
        )}

        {showSpeed && speedItem?.type === 'range' && (
          <SliderCard>
            <SettingHeader>
              <SettingTitle>{tLabel(speedItem.label)}</SettingTitle>
              <SettingValue>{Math.round(rangeRatio(speedValue, speedRange) * 4)} 档</SettingValue>
            </SettingHeader>
            <SliderArea>
              <SliderScale $ticks={17}>
                {Array.from({length: 17}, (_, i) => (
                  <SliderTick key={i} $label={i % 4 === 0 ? `${i / 4}.00` : undefined} />
                ))}
              </SliderScale>
              <SliderOuter>
                <SliderTrack>
                  <SliderProgress $ratio={rangeRatio(speedValue, speedRange)} />
                  <SliderThumb $ratio={rangeRatio(speedValue, speedRange)} />
                  <SliderInput
                    type="range"
                    min={speedRange.min}
                    max={speedRange.max}
                    value={speedValue}
                    aria-label="变换速度"
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setSpeed(v);
                      write(speedItem, v);
                    }}
                  />
                </SliderTrack>
              </SliderOuter>
              <SliderScale $ticks={17}>
                {Array.from({length: 17}, (_, i) => <SliderTick key={i} />)}
              </SliderScale>
            </SliderArea>
          </SliderCard>
        )}

        {showBrightness && brightnessItem && (
          <SliderCard>
            <SettingHeader>
              <SettingTitle>{tLabel(brightnessItem.label)}</SettingTitle>
              <SettingValue>{Math.round(rangeRatio(brightnessValue, brightnessRange) * 100)}%</SettingValue>
            </SettingHeader>
            <SliderArea>
              <SliderScale $ticks={21}>
                {Array.from({length: 21}, (_, i) => (
                  <SliderTick key={i} $label={i % 4 === 0 ? `${i * 5}%` : undefined} />
                ))}
              </SliderScale>
              <SliderOuter>
                <SliderTrack>
                  <SliderProgress $ratio={rangeRatio(brightnessValue, brightnessRange)} />
                  <SliderThumb $ratio={rangeRatio(brightnessValue, brightnessRange)} />
                  <SliderInput
                    type="range"
                    min={brightnessRange.min}
                    max={brightnessRange.max}
                    value={brightnessValue}
                    aria-label="亮度"
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setBrightness(v);
                      write(brightnessItem, v);
                    }}
                  />
                </SliderTrack>
              </SliderOuter>
              <SliderScale $ticks={21}>
                {Array.from({length: 21}, (_, i) => <SliderTick key={i} />)}
              </SliderScale>
            </SliderArea>
          </SliderCard>
        )}

        {showDirection && (
          <DirectionCard>
            <SettingHeader>
              <SettingTitle>变换方向</SettingTitle>
              <SettingValue />
            </SettingHeader>
            <DirectionOptions>
              {directionOptions.map((label, index) => (
                <DirectionOption
                  key={`${label}-${index}`}
                  $active={directionIndex === index}
                  aria-label={String(label)}
                  onClick={() => {
                    setDirectionIndex(index);
                    if (directionItem) write(directionItem, index);
                  }}
                >
                  {directionGlyph(String(label), index)}
                </DirectionOption>
              ))}
            </DirectionOptions>
          </DirectionCard>
        )}
        </ConfigColumn>
        </MiddleControls>
        </MiddlePanel>

        {showColor && colorItem && (
          <ColorPanel>
            <ColorHeader>
              <ColorTitle>自定义颜色</ColorTitle>
              <ColorSwitchButton
                type="button"
                role="switch"
                aria-label="启用自定义颜色"
                aria-checked={customColorEnabled}
                onClick={toggleCustomColor}
              >
                <ZoneSwitch $on={customColorEnabled} />
              </ColorSwitchButton>
            </ColorHeader>
            <ColorContent $disabled={!customColorEnabled}>
              <ColorPickerColumn>
                <ColorWheel
                  ref={colorWheelRef}
                  $hue={pickerHue}
                  onPointerDown={pickColorSquare}
                  onPointerMove={(event) => event.buttons === 1 && pickColorSquare(event)}
                  aria-label="颜色选择"
                  role="slider"
                >
                  <PickerHandle $x={pickerSat} $y={1 - pickerValue} $color={color} />
                </ColorWheel>
                <HueBar
                  ref={hueBarRef}
                  onPointerDown={pickHue}
                  onPointerMove={(event) => event.buttons === 1 && pickHue(event)}
                  aria-label="色相选择"
                  role="slider"
                >
                  <HueHandle $x={pickerHue / 360} $color={hsvToHex(pickerHue, 255, 255)} />
                </HueBar>
                <ColorInput
                  type="color"
                  value={color}
                  onChange={(e) => {
                    updateColorPreview(e.target.value);
                    scheduleColorCommit(e.target.value);
                  }}
                />
                <ColorInputRow>
                  <ColorLabel>HEX</ColorLabel>
                  <HexInput
                    value={hexText}
                    onChange={(e) => {
                      setHexText(e.target.value);
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                        updateColorPreview(v);
                        scheduleColorCommit(v);
                      }
                    }}
                    onBlur={() => {
                      if (/^#[0-9a-fA-F]{6}$/.test(hexText)) commitColor(hexText);
                    }}
                  />
                </ColorInputRow>
              </ColorPickerColumn>
              <PresetColumn>
                <PresetCard>
                  <ColorLabel>颜色预设</ColorLabel>
                  <Swatches>
                    {PRESET_COLORS.map((c) => (
                      <Swatch
                        key={c}
                        title={`选择颜色 ${c}`}
                        style={{background: c}}
                        $active={c === color}
                        onClick={() => commitColor(c)}
                      />
                    ))}
                  </Swatches>
                </PresetCard>
                <PresetCard>
                  <ColorLabel>最近使用</ColorLabel>
                  <Swatches>
                    {recent.map((c) => (
                      <Swatch
                        key={c}
                        title={`选择最近使用颜色 ${c}`}
                        style={{background: c}}
                        onClick={() => commitColor(c)}
                      />
                    ))}
                  </Swatches>
                </PresetCard>
              </PresetColumn>
            </ColorContent>
          </ColorPanel>
        )}

      </Card>
    </Page>
  );
};
