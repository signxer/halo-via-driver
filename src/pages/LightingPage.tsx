import React, {useEffect, useMemo, useState} from 'react';
import styled from 'styled-components';
import {NavTabs} from '../components/NavTabs';
import {DeviceHeader} from '../components/DeviceHeader';
import {useKeyboardStore} from '../store/keyboard';
import {hsvToHex, hexToHsv} from '../utils/color';
import {parseLightingMenus, findItem} from '../utils/lighting';
import type {LightingZone} from '../utils/lighting';
import keyMatrixLight from '../assets/nuphy/light/key-matrix-light.webp';
import keyMatrixLightCheck from '../assets/nuphy/light/key-matrix-light-check.webp';
import stripLight from '../assets/nuphy/light/strip-light.webp';
import stripLightCheck from '../assets/nuphy/light/strip-light-check.webp';
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
  left: 1.9rem;
  right: 1.9rem;
  bottom: 23.25rem;
  height: 1.875rem;
`;

const Card = styled.div`
  position: fixed;
  left: 1.9rem;
  right: 1.9rem;
  bottom: 0.5rem;
  background: var(--surface-page);
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 2px 8px var(--black-4);
  display: grid;
  grid-template-columns: 16.25rem 19.625rem 19.625rem minmax(30rem, 1fr);
  gap: 1rem;
  height: 23.25rem;
  overflow: hidden;
`;

// === 分区 tab(原版 lightTypeItem) ===
const ZoneTabs = styled.div`
  display: flex;
  flex-direction: column;
  gap: .5rem;
  margin: 0;
  grid-row: span 5;
`;

const ZoneTab = styled.button<{$active: boolean}>`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: .5rem;
  justify-content: center;
  height: 9.8125rem;
  min-height: 9.8125rem;
  padding: .5rem;
  border-radius: .75rem;
  background: ${(p) => (p.$active ? 'var(--button-active-background)' : 'transparent')};
  border: 0;
  transition: all 0.15s ease;
  cursor: pointer;
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
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-black-l-title);
  padding: .25rem 0 .5rem;
  grid-column: 2;
  grid-row: 1;
`;

// === 效果宫格(原版 lightTypeItem 网格) ===
const EffectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: .25rem;
  background: var(--surface-card);
  border-radius: .75rem;
  padding: .5rem;
  align-content: start;
  position: relative;
  top: -.875rem;
  grid-column: 2;
  grid-row: 2 / span 4;
`;

const EffectItem = styled.button<{$active: boolean}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .25rem;
  padding: .5rem .125rem;
  height: 3.5rem;
  border-radius: var(--border-radius-s);
  background: ${(p) => (p.$active ? 'var(--button-active-background)' : 'transparent')};
  border: 1px solid ${(p) => (p.$active ? 'var(--button-active-background)' : 'transparent')};
  transition: all 0.1s ease;
  cursor: pointer;
  color: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--text-primary)')};
  &:hover {
    border-color: var(--theme-color);
  }
`;

const EffectDot = styled.span<{$active: boolean}>`
  width: 1.25rem;
  height: 1.25rem;
  display: block;
  color: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--text-primary)')};
  opacity: ${(p) => (p.$active ? 1 : .72)};
  svg { width: 100%; height: 100%; fill: currentColor; }
`;

const EffectName = styled.span<{$active: boolean}>`
  font-size: 0.6875rem;
  font-weight: 500;
  color: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--text-primary)')};
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
`;

const GlobalLightToggle = styled.span<{$on: boolean}>`
  display: block;
  flex: none;
  width: 3.125rem;
  height: 1.875rem;
  padding: .125rem;
  box-sizing: border-box;
  border: 0;
  border-radius: 5rem;
  background: ${(p) => (p.$on ? 'var(--other-switch-on)' : 'var(--other-switch-off)')};
  cursor: pointer;
  &::after {
    content: '';
    display: block;
    width: 1.625rem;
    height: 1.625rem;
    border-radius: 50%;
    background: var(--other-switch-circle);
    transform: ${(p) => (p.$on ? 'translateX(1.375rem)' : 'translateX(0)')};
  }
`;

// === 原版 lightConfigSettingCard 滑块 ===
const SliderCard = styled.div<{$row: number}>`
  grid-column: 3;
  grid-row: ${(p) => p.$row};
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 6.765625rem;
  box-sizing: border-box;
  padding: .5rem;
  border-radius: .75rem;
  background: var(--surface-quiet);
`;

const SettingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 1rem;
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
  inset: 0 .375rem;
  height: 2rem;
  border-radius: .375rem;
  background: var(--slider-track);
`;

const SliderProgress = styled.div<{$ratio: number}>`
  position: absolute;
  left: 0;
  top: 0;
  width: ${(p) => `${p.$ratio * 100}%`};
  height: 100%;
  border-radius: .375rem;
  background: var(--slider-progress);
`;

const SliderThumb = styled.div<{$ratio: number}>`
  position: absolute;
  z-index: 2;
  left: ${(p) => `${p.$ratio * 100}%`};
  top: 50%;
  width: 1rem;
  height: 2.1875rem;
  box-sizing: border-box;
  transform: translate(-50%, -50%);
  border: .125rem solid var(--slider-thumb-border);
  border-radius: .375rem;
  background: var(--slider-thumb-background);
  box-shadow: 0 .125rem .25rem rgba(0,0,0,.1);
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

const DirectionCard = styled.div<{$row: number}>`
  grid-column: 3;
  grid-row: ${(p) => p.$row};
  display: flex;
  flex-direction: column;
  width: 100%;
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
const ColorSection = styled.div`
  display: grid;
  grid-template-columns: 15.5rem 1fr;
  grid-template-rows: 1.25rem 14rem 1.25rem 2rem;
  row-gap: .75rem;
  column-gap: .5rem;
  padding: .75rem .5rem;
  grid-column: 4;
  grid-row: 1 / span 5;
  align-content: start;
  background: var(--surface-quiet);
  align-items: start;
  > :nth-child(1) { grid-column: 1 / -1; grid-row: 1; }
  > :nth-child(2) { grid-column: 1; grid-row: 2; }
  > :nth-child(3) { grid-column: 1; grid-row: 3; }
  > :nth-child(4) { display: none; }
  > :nth-child(5) { grid-column: 1; grid-row: 4; align-self: center; }
  > :nth-child(6) { grid-column: 1; grid-row: 4; justify-self: end; align-self: center; }
  > :nth-child(7) { grid-column: 2; grid-row: 2; padding-top: 1.75rem; }
  > :nth-child(8) { grid-column: 2; grid-row: 2; align-content: start; padding-top: 1.75rem; }
  > :nth-child(9) { grid-column: 2; grid-row: 2; align-self: start; padding-top: 10rem; }
  > :nth-child(10) { grid-column: 2; grid-row: 2; align-self: start; padding-top: 12rem; }
`;

const ColorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const ColorWheel = styled.div`
  width: 15rem;
  height: 14rem;
  border-radius: .75rem;
  background:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, transparent),
    linear-gradient(135deg, #5a00ff, #00b7ff);
`;

const HueBar = styled.div`
  width: 15rem;
  height: 1rem;
  border-radius: .5rem;
  background: linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);
`;

const ColorInput = styled.input`
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
  width: 72px;
  border: 1px solid var(--black-8);
  border-radius: var(--border-radius-s);
  padding: 4px 8px;
  font-size: 0.75rem;
  font-family: 'SF Mono', Menlo, monospace;
  color: var(--text-black-l-title);
  background: var(--surface-card);
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
  gap: 6px;
  flex-wrap: wrap;
`;

const Swatch = styled.button<{$active?: boolean}>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${(p) => (p.$active ? 'var(--theme-color)' : 'var(--white-100)')};
  box-shadow: 0 0 0 1px var(--black-8);
  cursor: pointer;
`;

const PRESET_COLORS = [
  '#ff7526', '#fff029', '#65e5b1', '#438ceb', '#8277df',
  '#d948a5', '#ed3434', '#f8c23c', '#71d7e4', '#5be94d', '#3735dc', '#db42d2',
];

const EFFECT_LABELS = [
  '光谱', '阶梯', '静态', '呼吸', '百花', '波浪', '上下波浪', '喷泉',
  '银河', '旋转', '涟漪', '单点', '宫格', '流光', '落雨', '波带', '游戏', '定位', '风车', '双标',
];

// JSON menus 里的英文标签 → 原版中文
const LABEL_MAP: Record<string, string> = {
  Backlight: '背光灯',
  Brightness: '亮度',
  Effect: '效果',
  'Effect Speed': '变换速度',
  Direction: '变换方向',
  Color: '颜色',
  'Strip Light': '条形灯',
};
const tLabel = (s: string): string => LABEL_MAP[s] ?? s;

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
  const match = /^\{([^}]+)\}\s*(==|!=)\s*(-?\d+(?:\.\d+)?)$/.exec(item.showIf.trim());
  if (!match) return true;
  const current = values[match[1]];
  if (current === undefined) return true;
  const expected = Number(match[3]);
  return match[2] === '==' ? current === expected : current !== expected;
};

const directionGlyph = (label: string, index: number): string => {
  if (/left|左|←/i.test(label)) return '←';
  if (/right|右|→/i.test(label)) return '→';
  return index === 0 ? '←' : '→';
};

export const LightingPage: React.FC = () => {
  const {mode, api, definition, initDemo} = useKeyboardStore();
  const parsedZones = parseLightingMenus(definition);
  // Halo65 V2 的侧灯与主灯共用 VIA 灯效通道；NuPhy 页面仍将它们
  // 作为两个可切换的视觉分区展示，因此这里补足第二张分区卡片。
  const zones = useMemo(() => {
    if (parsedZones.length !== 1) return parsedZones;
    return [...parsedZones, {...parsedZones[0], label: 'Strip Light'}];
  }, [parsedZones]);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [brightness, setBrightness] = useState(255);
  const [speed, setSpeed] = useState(128);
  const [effect, setEffect] = useState(1);
  const [directionIndex, setDirectionIndex] = useState(1);
  const [color, setColor] = useState('#d9d9d9');
  const [hexText, setHexText] = useState('#d9d9d9');
  const [recent, setRecent] = useState<string[]>(readRecent());
  const [zoneEnabled, setZoneEnabled] = useState<boolean[]>([true, true]);
  const [allLightsOn, setAllLightsOn] = useState(false);

  const zone: LightingZone | undefined = zones[zoneIdx];
  const effectItem = zone ? findItem(zone, 'dropdown') : undefined;
  const brightnessItem = zone ? findItem(zone, 'range', 'Brightness') : undefined;
  const speedItem = zone ? findItem(zone, 'range', 'Speed') : undefined;
  const directionItem = zone ? zone.items.find((item) => /direction|方向/i.test(item.label)) : undefined;
  const colorItem = zone ? findItem(zone, 'color') : undefined;
  const fullEffects = effectItem?.options?.slice(0, 20) ?? [];
  const stripEffectIds = [0, 1, 2, 5, 17];
  const effectChoices = zoneIdx === 1
    ? stripEffectIds.map((sourceIndex) => ({sourceIndex, name: EFFECT_LABELS[sourceIndex]}))
    : fullEffects.map((name, sourceIndex) => ({sourceIndex, name: EFFECT_LABELS[sourceIndex] ?? name}));
  const effectValue = effectChoices[effect]?.sourceIndex ?? 0;
  const showIfValues = effectItem ? {[effectItem.id]: effectValue} : {};
  const showSpeed = Boolean(speedItem && showIfMatches(speedItem, showIfValues));
  const showBrightness = Boolean(brightnessItem && showIfMatches(brightnessItem, showIfValues));
  const showDirection = Boolean(directionItem && showIfMatches(directionItem, showIfValues));
  const showColor = Boolean(colorItem && showIfMatches(colorItem, showIfValues));
  const speedRange = rangeFromItem(speedItem, {min: 0, max: 255});
  const brightnessRange = rangeFromItem(brightnessItem, {min: 0, max: 255});
  const speedValue = clampToRange(speed, speedRange);
  const brightnessValue = clampToRange(brightness, brightnessRange);
  const directionOptions = directionItem?.options?.length
    ? directionItem.options
    : ['left', 'right'];
  const brightnessRow = 2 + (showSpeed ? 1 : 0);
  const directionRow = brightnessRow + (showBrightness ? 1 : 0);

  useEffect(() => {
    if (zoneIdx === 1 && effect >= effectChoices.length) setEffect(0);
  }, [zoneIdx, effectChoices.length, effect]);

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
            if (res[1] !== undefined) setBrightness(res[1]);
          }
          if (speedItem) {
            const res = await api.getCustomMenuValue([speedItem.channel, speedItem.command]);
            if (res[1] !== undefined) setSpeed(res[1]);
          }
          if (effectItem) {
            const res = await api.getCustomMenuValue([effectItem.channel, effectItem.command]);
            if (res[1] !== undefined) setEffect(res[1]);
          }
          if (directionItem) {
            const res = await api.getCustomMenuValue([directionItem.channel, directionItem.command]);
            if (res[1] !== undefined) setDirectionIndex(res[1]);
          }
          if (colorItem) {
            const res = await api.getCustomMenuValue([colorItem.channel, colorItem.command]);
            if (res[1] !== undefined && res[2] !== undefined) {
              const hex = hsvToHex(hueToDeg(res[1]), res[2]);
              setColor(hex);
              setHexText(hex);
            }
          }
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, api, zoneIdx]);

  const write = async (item: {channel: number; command: number}, ...vals: number[]) => {
    if (mode === 'connected' && api) {
      try {
        await api.setCustomMenuValue(item.channel, item.command, ...vals);
      } catch {}
    }
  };

  const applyColor = (hex: string) => {
    setColor(hex);
    setHexText(hex);
    const {h, s} = hexToHsv(hex);
    if (colorItem) write(colorItem, degToHue(h), s);
    const next = [hex, ...recent.filter((c) => c !== hex)].slice(0, 8);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  };

  if (zones.length === 0) {
    return (
      <Page>
        <DeviceHeader />
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
      <DeviceHeader />
      <PageNav><NavTabs /></PageNav>
      <Card>
        <ZoneTabs>
          {zones.map((z, i) => (
            <ZoneTab
              key={z.label}
              $active={i === zoneIdx}
              title={`切换到${tLabel(z.label)}设置`}
              onClick={() => setZoneIdx(i)}
              >
                <img
                src={
                  i === zoneIdx
                    ? i === 0
                      ? keyMatrixLightCheck
                      : stripLightCheck
                    : i === 0
                      ? keyMatrixLight
                      : stripLight
                }
                alt=""
                />
              <ZoneDetail>
                <ZoneText>
                  <ZoneLabel $active={i === zoneIdx}>{tLabel(z.label)}设置</ZoneLabel>
                  <ZoneDescription $active={i === zoneIdx}>设置键盘的{tLabel(z.label)}效果</ZoneDescription>
                </ZoneText>
                <span
                  role="switch"
                  aria-checked={zoneEnabled[i] ?? true}
                  onClick={(event) => {
                    event.stopPropagation();
                    setZoneEnabled((current) => current.map((value, index) => index === i ? !value : value));
                  }}
                >
                  <ZoneSwitch $on={zoneEnabled[i] ?? true} />
                </span>
              </ZoneDetail>
            </ZoneTab>
          ))}
        </ZoneTabs>

        <SectionHeader>灯光设置</SectionHeader>

        {effectItem && effectItem.options && (
          <EffectGrid>
            {effectChoices.map(({sourceIndex, name}, i) => (
              <EffectItem
                key={`${name}-${sourceIndex}`}
                $active={i === effect}
                title={`${name}：${effectItem.options?.[sourceIndex] ?? name}`}
                onClick={() => {
                  setEffect(i);
                  write(effectItem, sourceIndex);
                }}
              >
                <EffectDot $active={i === effect}>
                  <svg viewBox="0 0 25 24" aria-hidden="true"><use href={`${lightSprite}#lightType${sourceIndex}`} /></svg>
                </EffectDot>
                <EffectName $active={i === effect}>{name}</EffectName>
              </EffectItem>
            ))}
          </EffectGrid>
        )}

        {showSpeed && speedItem && (
          <SliderCard $row={2}>
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
          <SliderCard $row={brightnessRow}>
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
          <DirectionCard $row={directionRow}>
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

        {showColor && colorItem && (
          <ColorSection>
            <ColorHeader>
              <ColorLabel>自定义颜色</ColorLabel>
              <GlobalLightToggle
                className="global-light-toggle"
                role="switch"
                aria-label="关闭灯光"
                aria-checked={allLightsOn}
                $on={allLightsOn}
                onClick={() => setAllLightsOn((value) => !value)}
              />
            </ColorHeader>
            <ColorWheel />
            <HueBar />
            <ColorInput
              type="color"
              value={color}
              onChange={(e) => applyColor(e.target.value)}
            />
            <ColorLabel>HEX</ColorLabel>
            <HexInput
              value={hexText}
              onChange={(e) => {
                setHexText(e.target.value);
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{6}$/.test(v)) applyColor(v);
              }}
            />
            <ColorLabel>颜色预设</ColorLabel>
            <Swatches>
              {PRESET_COLORS.map((c) => (
                <Swatch
                  key={c}
                  title={`选择颜色 ${c}`}
                  style={{background: c}}
                  $active={c === color}
                  onClick={() => applyColor(c)}
                />
              ))}
            </Swatches>
            <ColorLabel>最近使用</ColorLabel>
            <Swatches>
              {recent.map((c) => (
                <Swatch
                  key={c}
                  title={`选择最近使用颜色 ${c}`}
                  style={{background: c}}
                  onClick={() => applyColor(c)}
                />
              ))}
            </Swatches>
          </ColorSection>
        )}

      </Card>
    </Page>
  );
};
