import React, {useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import styled from 'styled-components';
import {buildKeycodeGroups} from '../utils/keycode';
import {getByteForCode} from '../via/key';
import {getBasicKeyDict} from '../via/key-to-byte/dictionary-store';
import type {IKeycode} from '../via/key';
import {keycodeExplanation, remapLabels} from '../i18n';
import navSprite from '../assets/nuphy/icons/nav-symbols.svg?url';
import keySprite from '../assets/nuphy/icons/key-symbols.svg?url';
import type {CustomKeycode} from '../types/definition';

// ============================================================
// 原版键码选择面板 — 像素级复刻
// .tabBottomContent > 
//   .key-option-list-cart (flex col, gap 0.5rem, bg white, radius 1rem, padding 0.5rem)
//     .nav-button-content x N (flex, padding 0 0.125rem, radius 0.375rem)
//   .key-list-box (flex wrap, bg white, radius 1rem, padding 0.5rem)
//     .key-table-card-content x N (bg black-2, radius 0.75rem, padding 0.5rem)
//       .key-search-box (flex, bg black-4, radius 0.5rem, padding 0.125rem 0.25rem)
// ============================================================

const CATEGORY_ICONS: Record<string, string> = {
  basic: 'BasicCharacters', media: 'MediaControlSymbols',
  lighting: 'RGBControlSymbols', special: 'SpecialCharacters',
  macro: 'MacroKeyCharacters',
};

const CATEGORY_LABELS: Record<string, string> = {
  basic: remapLabels.basic,
  media: remapLabels.media,
  lighting: remapLabels.lighting,
  special: remapLabels.special,
  macro: remapLabels.macro,
};

/**
 * Halo65 HE's original key iconName mapping.  The source uses the longer
 * NuPhy names while VIA exposes the equivalent QMK short names, so both are
 * kept here where the two APIs differ.
 */
const KEY_ICONS: Record<string, string> = {
  KC_MSEL: 'mediaKeys_keyIcon0', KC_MEDIA_PLAYER: 'mediaKeys_keyIcon0',
  KC_VOLU: 'mediaKeys_keyIcon1', KC_VOLD: 'mediaKeys_keyIcon2',
  KC_VOL_UP: 'mediaKeys_keyIcon1', KC_VOL_DOWN: 'mediaKeys_keyIcon2',
  KC_MUTE: 'mediaKeys_keyIcon3', KC_MPLY: 'mediaKeys_keyIcon4', KC_PLAY: 'mediaKeys_keyIcon4',
  KC_MSTP: 'mediaKeys_keyIcon5', KC_MEDIA_STOP: 'mediaKeys_keyIcon5', KC_MPRV: 'mediaKeys_keyIcon6', KC_MEDIA_PREV: 'mediaKeys_keyIcon6',
  KC_MNXT: 'mediaKeys_keyIcon7', KC_MEDIA_NEXT: 'mediaKeys_keyIcon7', KC_BRIU: 'mediaKeys_keyIcon8', KC_SCRN_BRIGHTNESS_UP: 'mediaKeys_keyIcon8',
  KC_BRID: 'mediaKeys_keyIcon9', KC_SCRN_BRIGHTNESS_DOWN: 'mediaKeys_keyIcon9', KC_WWW_HOME: 'mediaKeys_keyIcon10',
  KC_WWW_REFRESH: 'mediaKeys_keyIcon11', KC_WWW_STOP: 'mediaKeys_keyIcon12',
  KC_WWW_BACK: 'mediaKeys_keyIcon13', KC_WWW_FORWARD: 'mediaKeys_keyIcon14',
  KC_WWW_FAVORITES: 'mediaKeys_keyIcon15', KC_WWW_SEARCH: 'mediaKeys_keyIcon16',
  KC_MYCM: 'mediaKeys_keyIcon17', KC_MY_COMPUTER: 'mediaKeys_keyIcon17', KC_CALC: 'mediaKeys_keyIcon18', KC_CALCULATOR: 'mediaKeys_keyIcon18',
  KC_MAIL: 'mediaKeys_keyIcon19', KC_EJCT: 'EjectKeyIcon',
  KC_MS_BTN1: 'specialKeys_keyIcon0', KC_MS_LEFT_BTN: 'specialKeys_keyIcon0', KC_MS_BTN2: 'specialKeys_keyIcon1', KC_MS_MIDDLE_BTN: 'specialKeys_keyIcon1',
  KC_MS_BTN3: 'specialKeys_keyIcon2', KC_MS_RIGHT_BTN: 'specialKeys_keyIcon2', KC_MS_GO_AHEAD: 'specialKeys_keyIcon5',
  KC_MS_GO_BACK: 'specialKeys_keyIcon4', KC_MS_WH_UP: 'specialKeys_keyIcon7',
  KC_MS_WH_DOWN: 'specialKeys_keyIcon6', KC_MS_WH_LEFT: 'KcMsWhLeft',
  KC_MS_WH_RIGHT: 'KcMsWhRight',
  KC_MCTL: 'missioncontrol', KC_LPAD: 'launchpad',
  BL_TOGG: 'lightKeys_keyIcon21', RGB_TOG: 'lightKeys_keyIcon21', UG_TOGG: 'lightKeys_keyIcon21', RM_TOGG: 'lightKeys_keyIcon21',
  BL_DEC: 'lightKeys_keyIcon4', RGB_VAD: 'lightKeys_keyIcon4', UG_VALD: 'lightKeys_keyIcon4', RM_VALD: 'lightKeys_keyIcon4',
  BL_INC: 'lightKeys_keyIcon3', RGB_VAI: 'lightKeys_keyIcon3', UG_VALU: 'lightKeys_keyIcon3', RM_VALU: 'lightKeys_keyIcon3',
  BL_STEP: 'lightKeys_keyIcon22', RGB_RMOD: 'lightKeys_keyIcon22', RGB_MOD: 'lightKeys_keyIcon22', UG_NEXT: 'lightKeys_keyIcon22', UG_PREV: 'lightKeys_keyIcon22', RM_NEXT: 'lightKeys_keyIcon22', RM_PREV: 'lightKeys_keyIcon22',
  RGB_SPD: 'lightKeys_keyIcon7', UG_SPDD: 'lightKeys_keyIcon7', RM_SPDD: 'lightKeys_keyIcon7',
  RGB_SPI: 'lightKeys_keyIcon8', UG_SPDU: 'lightKeys_keyIcon8', RM_SPDU: 'lightKeys_keyIcon8',
  RGB_HUD: 'lightKeys_keyIcon4', RGB_SAD: 'lightKeys_keyIcon4', RGB_HUI: 'lightKeys_keyIcon3', RGB_SAI: 'lightKeys_keyIcon3',
};

const CUSTOM_KEY_ICONS: Record<string, string> = {
  'Link RF': 'link_24g',
  'Link BLE_1': 'link_bl1', 'Link BLE_2': 'link_bl2', 'Link BLE_3': 'link_bl3',
  'Mac Task': 'missioncontrol', 'Mac Search': 'search',
  'Mac Siri Voice': 'siri', 'Mac Dnt': 'macdnd',
  'Side Light +': 'lightKeys_keyIcon3', 'Side Light -': 'lightKeys_keyIcon4',
  'Side Next Mode': 'lightKeys_keyIcon22', 'Side Next Color': 'lightKeys_keyIcon22',
  'Side Speed +': 'lightKeys_keyIcon8', 'Side Speed -': 'lightKeys_keyIcon7',
};

const KEY_SPRITE_ICONS = new Set([
  'mediaKeys_keyIcon0', 'mediaKeys_keyIcon10', 'mediaKeys_keyIcon11',
  'mediaKeys_keyIcon12', 'mediaKeys_keyIcon13', 'mediaKeys_keyIcon14',
  'mediaKeys_keyIcon15', 'mediaKeys_keyIcon16', 'mediaKeys_keyIcon17',
  'EjectKeyIcon', 'KcMsWhLeft', 'KcMsWhRight',
  'specialKeys_keyIcon0', 'specialKeys_keyIcon1', 'specialKeys_keyIcon2',
  'specialKeys_keyIcon4', 'specialKeys_keyIcon5', 'specialKeys_keyIcon6',
  'specialKeys_keyIcon7', 'link_24g', 'link_bl1', 'link_bl2', 'link_bl3',
]);

const KEY_LABELS: Record<string, string> = {
  KC_PSCR: 'PRTSC', KC_BSPC: 'BACKSPACE', KC_NLCK: 'NUM',
  KC_PENT: 'NUM\nENTER', KC_LSFT: 'SHIFT', KC_RSFT: 'SHIFT',
  KC_LCTL: 'CTRL', KC_RCTL: 'CTRL', KC_LGUI: 'CMD', KC_RGUI: 'CMD',
  KC_LALT: 'OPT', KC_RALT: 'OPT', KC_SPC: 'SPACE', KC_ENT: 'ENTER',
  KC_TAB: 'TAB', KC_CAPS: 'CAPS', KC_ESC: 'ESC', KC_DEL: 'DEL',
  KC_PGUP: 'PGUP', KC_PGDN: 'PGDN', KC_LEFT: '←', KC_DOWN: '↓',
  KC_UP: '↑', KC_RGHT: '→',
};

// === 左侧分类列表 ===
const OptionListCart = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 0.5rem;
  flex-shrink: 0;
  width: 7.44rem;
  height: 100%;
  overflow: visible;
  box-sizing: border-box;
`;

const NavBtnItem = styled.div<{$active: boolean}>`
  display: flex;
  min-width: 0;
  min-height: 1.5rem;
  padding: 0.125rem 0.25rem;
  justify-content: flex-start;
  align-items: center;
  align-self: stretch;
  gap: 0.125rem;
  border-radius: 0.5rem;
  position: relative;
  cursor: pointer;
  color: ${(p) => (p.$active ? 'var(--text-white-l-title)' : 'var(--text-black-l-title)')};
  background: ${(p) => (p.$active ? 'var(--button-black-l)' : 'transparent')};
  transition: background 0.3s;
  &:hover {
    background: ${(p) => (p.$active ? 'var(--button-black-l)' : 'var(--button-black-xs-min)')};
  }
`;

const NavBtnContent = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  min-width: 0;
  flex: 1 0 0;
  border-radius: 0.375rem;
  padding: 0 0.125rem;
  gap: 0.5rem;
  overflow: hidden;
`;

const NavBtnIcon = styled.div`
  height: auto;
  max-height: 100%;
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg {
    display: block;
    width: 1.25rem;
    height: 1.25rem;
    min-width: 1.25rem;
    fill: currentColor;
    color: inherit;
    stroke: none;
  }
`;

const NavBtnName = styled.span<{$active: boolean}>`
  display: block;
  min-width: 0;
  flex: 1 1 0;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: normal;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${(p) => (p.$active ? 'var(--text-white-l-title)' : 'var(--text-black-l-title)')};
  white-space: nowrap;
`;

// === 右侧键码网格 ===
const KeyListBox = styled.div`
  display: block;
  flex: 1;
  min-width: 0;
  margin-left: 0.5rem;
  border-radius: 1rem;
  padding: 0.5rem;
  background: var(--surface-card);
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
`;

const KeyContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  width: 100%;
  height: 100%;
  min-height: 0;
  gap: 0.5rem;
`;

const KeyCard = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  gap: 0.25rem;
  padding: 0;
  border-radius: 0;
  background: transparent;
  &:first-child { flex: 1.44; }
  &:last-child { flex: 1; }
`;

const KeyTableCard = styled.div`
  position: relative;
  display: block;
  flex: 1 1 0;
  width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0.5rem;
  border-radius: 0.75rem;
  background: var(--surface-quiet);
  overflow: auto;
`;

const SearchBox = styled.div`
  display: flex;
  height: 1.5rem;
  align-items: center;
  gap: 0.25rem;
  background: var(--surface-input);
  border-radius: 0.5rem;
  padding: 0.125rem 0.25rem;
  flex-shrink: 0;
  overflow: hidden;
  input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none;
    background: transparent;
    outline: none;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 0.75rem;
    font-weight: 700;
    line-height: normal;
    color: var(--text-black-l-title);
    &::placeholder {
      color: var(--text-black-s-content);
    }
  }
`;

const SidebarSearchBox = styled(SearchBox)`
  margin-top: auto;
  margin-bottom: 0;
  width: 100%;
`;

const SearchIcon = styled.svg`
  width: 1.5rem;
  height: 1.5rem;
  flex: 0 0 auto;
  fill: currentColor;
  color: var(--text-black-l-title);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  height: 0.967rem;
  flex-shrink: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.15;
  color: var(--text-black-l-title);
`;

const KeyGrid = styled.div<{$physical?: boolean}>`
  display: ${(p) => (p.$physical ? 'block' : 'flex')};
  flex-wrap: ${(p) => (p.$physical ? 'nowrap' : 'wrap')};
  position: ${(p) => (p.$physical ? 'relative' : 'static')};
  min-width: ${(p) => (p.$physical ? '59.19rem' : '0')};
  min-height: ${(p) => (p.$physical ? '18.9rem' : '0')};
  height: ${(p) => (p.$physical ? '100%' : 'auto')};
  gap: 0.125rem;
  flex: 1;
  overflow: ${(p) => (p.$physical ? 'visible' : 'auto')};
  align-content: flex-start;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

// 原版键码格:3rem 方块,radius 1rem,居中标签/图标
const KeyBtn = styled.button<{
  $selected: boolean;
  $physical?: boolean;
  $keyWidth?: number;
  $keyHeight?: number;
  $x?: number;
  $y?: number;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: ${(p) => (p.$physical ? `${p.$keyWidth ?? 3}rem` : '3rem')};
  height: ${(p) => (p.$physical ? `${p.$keyHeight ?? 3}rem` : '3rem')};
  position: ${(p) => (p.$physical ? 'absolute' : 'relative')};
  left: ${(p) => (p.$physical ? `${p.$x ?? 0}rem` : 'auto')};
  top: ${(p) => (p.$physical ? `${p.$y ?? 0}rem` : 'auto')};
  margin: 0;
  border-radius: 1rem;
  background: ${(p) => (p.$selected ? 'var(--selection-fill)' : 'transparent')};
  color: var(--text-black-l-title);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: normal;
  padding: 0 0.36rem;
  border: 0;
  box-shadow: none;
  cursor: pointer;
  z-index: 0;
  transition: all 0.1s;
  white-space: normal;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 0.09375rem solid ${(p) => (p.$selected ? 'var(--selection-border)' : 'var(--key-settings-black-border)')};
    border-radius: inherit;
    opacity: 1;
    pointer-events: none;
  }
  &:hover {
    z-index: 20;
    &::after { border-color: var(--selection-border); }
  }
  svg {
    width: 1.75rem;
    height: 1.75rem;
    fill: currentColor;
  }
`;

// 原版 tooltip 会挂在 body 下，而不是放在 key-table-card-content 内，
// 这样提示框可以越过键码卡片边界显示。结构与原版 tooltipBorderInside_v
// / tooltipBorderInsideB_top / tooltipBorderInsideB_bottom 对齐。
const TooltipPortal = styled.div`
  position: fixed;
  z-index: 999;
  display: flex;
  justify-content: center;
  max-height: 0;
  pointer-events: none;
`;

const TooltipCard = styled.div<{$visible: boolean}>`
  visibility: ${(p) => (p.$visible ? 'visible' : 'hidden')};
  min-width: 4.75rem;
  min-height: 2rem;
  position: absolute;
  bottom: 0;
  transform-origin: center bottom;
  animation: ${(p) => (p.$visible ? 'scaleInTop' : 'none')} 0.1s ease;

  .tooltip-top {
    min-width: 4.75rem;
    min-height: 2rem;
    border: 0.09375rem solid var(--box-nested-black-xl-border);
    border-radius: 10px;
    background: var(--box-nested-white-xl-max);
    box-shadow: 0 0.0625rem 0.3125rem rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .tooltip-content {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    font-weight: 700;
    line-height: 1.15;
    white-space: nowrap;
  }

  .tooltip-content > span {
    color: var(--text-black-l-title);
    font-size: 0.75rem;
  }

  .tooltip-bottom,
  .tooltip-bottom > div {
    width: 100%;
    display: flex;
    justify-content: center;
    position: relative;
  }

  .tooltip-bottom {
    height: 10px;
  }

  .tooltip-bottom > .tooltip-tail-row {
    position: absolute;
    left: 0;
    width: 100%;
    flex: 0 0 100%;
  }

  .tooltip-tail-row {
    height: 10px;
  }

  .tooltip-line {
    width: 20px;
    height: 0.0625rem;
    position: absolute;
    background: var(--box-nested-black-xl-border);
  }

  .tooltip-face {
    width: 20px;
    height: 10px;
    position: relative;
    background: var(--box-nested-black-xl-border);
    clip-path: path('M 0 0 C 10 0 12.5 7.5 20 7.5 L 20 0 Z');
  }

  .tooltip-face::before {
    content: '';
    position: absolute;
    top: -2px;
    width: 110%;
    height: 2px;
    background: var(--box-nested-black-xl-border);
  }

  .tooltip-face::after {
    content: '';
    position: absolute;
    right: -1px;
    width: 2px;
    height: 100%;
    background: var(--box-nested-black-xl-border);
  }

  .tooltip-face.right {
    transform: scaleX(-1);
  }

  .tooltip-fill {
    position: absolute;
    top: -1.5px;
  }

  .tooltip-fill .tooltip-line,
  .tooltip-fill .tooltip-face {
    background: var(--box-nested-white-xl-max);
  }

  .tooltip-fill .tooltip-face::before,
  .tooltip-fill .tooltip-face::after {
    background: var(--box-nested-white-xl-max);
  }

  @keyframes scaleInTop {
    0% { transform: scale(0.8); transform-origin: center bottom; }
    100% { transform: scale(1); transform-origin: center bottom; }
  }
`;

type KeyTooltipProps = {
  text: string;
  children: React.ReactNode;
  selected: boolean;
  physical?: boolean;
  keyWidth?: number;
  keyHeight?: number;
  x?: number;
  y?: number;
  onClick: () => void;
};

const KeyTooltip: React.FC<KeyTooltipProps> = ({
  text, children, selected, physical, keyWidth, keyHeight, x, y, onClick,
}) => {
  const targetRef = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const handleEnter = () => {
    const next = targetRef.current?.getBoundingClientRect();
    if (next) setRect(next);
  };

  return (
    <>
      <KeyBtn
        ref={targetRef}
        $selected={selected}
        $physical={physical}
        $keyWidth={keyWidth}
        $keyHeight={keyHeight}
        $x={x}
        $y={y}
        onClick={onClick}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setRect(null)}
        aria-label={text}
      >
        {children}
      </KeyBtn>
      {rect && typeof document !== 'undefined' && createPortal(
        <TooltipPortal style={{left: rect.left, top: rect.top, width: rect.width, height: rect.height}}>
          <TooltipCard $visible>
            <div className="tooltip-top">
              <div className="tooltip-content"><span>{text}</span></div>
            </div>
            <div className="tooltip-bottom">
              <div className="tooltip-tail-row">
                <div className="tooltip-line" />
                <div className="tooltip-face" />
                <div className="tooltip-face right" />
              </div>
              <div className="tooltip-tail-row tooltip-fill">
                <div className="tooltip-line" />
                <div className="tooltip-face" />
                <div className="tooltip-face right" />
              </div>
            </div>
          </TooltipCard>
        </TooltipPortal>,
        document.body,
      )}
    </>
  );
};

const KeyLabel = styled.p`
  display: block;
  min-width: 2.375rem;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
  text-align: center;
  line-height: 1.15;
`;

type PickerKeyGeometry = {
  code: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
};

// 原版 key-table-card-content 的物理键位几何。
// 基准键为 3rem，横向节距 3.12rem，纵向节距 3.18rem；
// 宽键/长键使用独立 w/h，而不是通过 CSS 拉伸统一方块。
const pickerRow = (
  y: number,
  items: Array<string | {code: string; w?: number; h?: number; x?: number}>,
): PickerKeyGeometry[] => {
  let cursor = 0;
  return items.map((item) => {
    const key = typeof item === 'string' ? {code: item} : item;
    const result = {code: key.code, x: key.x ?? cursor, y, w: key.w ?? 3, h: key.h ?? 3};
    cursor = result.x + result.w + 0.12;
    return result;
  });
};

const PICKER_KEY_GEOMETRY: PickerKeyGeometry[] = [
  ...pickerRow(0, [
    'KC_ESC', 'KC_F1', 'KC_F2', 'KC_F3', 'KC_F4', 'KC_F5', 'KC_F6',
    'KC_F7', 'KC_F8', 'KC_F9', 'KC_F10', 'KC_F11', 'KC_F12',
    'KC_PSCR', 'KC_DEL', 'KC_HOME', 'KC_END', 'KC_PGUP', 'KC_PGDN',
  ]),
  ...pickerRow(3.18, [
    'KC_GRV', 'KC_1', 'KC_2', 'KC_3', 'KC_4', 'KC_5', 'KC_6', 'KC_7',
    'KC_8', 'KC_9', 'KC_0', 'KC_MINS', 'KC_EQL',
    {code: 'KC_BSPC', w: 6.12},
    {code: 'KC_NLCK', x: 46.8}, 'KC_PSLS', 'KC_PAST', 'KC_PMNS',
  ]),
  ...pickerRow(6.36, [
    {code: 'KC_TAB', w: 4.5},
    'KC_Q', 'KC_W', 'KC_E', 'KC_R', 'KC_T', 'KC_Y', 'KC_U', 'KC_I', 'KC_O', 'KC_P',
    'KC_LBRC', 'KC_RBRC', {code: 'KC_BSLS', w: 4.65},
    {code: 'KC_P7', x: 46.83}, 'KC_P8', 'KC_P9', {code: 'KC_PPLS', x: 56.19, h: 6.18},
  ]),
  ...pickerRow(9.54, [
    {code: 'KC_CAPS', w: 6},
    'KC_A', 'KC_S', 'KC_D', 'KC_F', 'KC_G', 'KC_H', 'KC_J', 'KC_K', 'KC_L', 'KC_SCLN', 'KC_QUOT',
    {code: 'KC_ENT', w: 6.24},
    {code: 'KC_P4', x: 46.8}, 'KC_P5', 'KC_P6',
  ]),
  ...pickerRow(12.72, [
    {code: 'KC_LSFT', w: 6},
    'KC_Z', 'KC_X', 'KC_C', 'KC_V', 'KC_B', 'KC_N', 'KC_M', 'KC_COMM', 'KC_DOT', 'KC_SLSH',
    {code: 'KC_RSFT', w: 6.24}, 'KC_UP',
    {code: 'KC_P1', x: 46.8}, 'KC_P2', 'KC_P3', {code: 'KC_PENT', x: 56.16, h: 6.18},
  ]),
  ...pickerRow(15.9, [
    {code: 'KC_LCTL', w: 3.99}, {code: 'KC_LGUI', x: 4.137, w: 3.99}, {code: 'KC_LALT', x: 8.277, w: 3.99},
    {code: 'KC_SPC', x: 12.36, w: 15.48}, {code: 'KC_RALT', x: 27.96, w: 4.08}, {code: 'KC_RGUI', x: 32.16, w: 4.08},
    {code: 'KC_RCTL', x: 36.36, w: 4.11}, {code: 'KC_LEFT', x: 40.59}, {code: 'KC_DOWN', x: 43.71}, {code: 'KC_RGHT', x: 46.83},
    {code: 'KC_P0', x: 49.95}, {code: 'KC_PDOT', x: 53.07},
  ]),
];

// === 工具函数 ===
function toByteValue(kc: {code: string; value?: number}): number {
  if (typeof kc.value === 'number') return kc.value;
  const dict = getBasicKeyDict(13, 13);
  try {
    const v = getByteForCode(kc.code, dict);
    return v ?? 0;
  } catch { return 0; }
}

// === 组件 ===
type KeycodePickerProps = {
  customKeycodes?: CustomKeycode[];
  currentValue: number;
  onSelect: (value: number) => void;
};

export const KeycodePicker: React.FC<KeycodePickerProps> = ({
  customKeycodes, currentValue, onSelect,
}) => {
  const groups = useMemo(() => buildKeycodeGroups(customKeycodes), [customKeycodes]);
  const [activeTab, setActiveTab] = useState(groups[0]?.id ?? 'basic');
  const [query, setQuery] = useState('');

  const active = groups.find((g) => g.id === activeTab) ?? groups[0];

  const filtered = useMemo(() => {
    if (!active) return [];
    if (!query.trim()) return active.keycodes;
    const q = query.trim().toLowerCase();
    return active.keycodes.filter(
      (k) =>
        k.code.toLowerCase().includes(q) ||
        k.name.toLowerCase().includes(q) ||
        (k.title ?? '').toLowerCase().includes(q),
    );
  }, [active, query]);

  const commonCodes = new Set([
    'KC_INS', 'KC_SLCK', 'KC_PAUS', 'KC_APP', 'KC_MENU', 'KC_MUTE',
    'KC_VOLU', 'KC_VOLD', 'KC_MNXT', 'KC_MPRV', 'KC_MPLY', 'KC_CALC',
    'KC_MAIL', 'KC_WWW_SEARCH', 'KC_SLEP', 'KC_WAKE',
  ]);
  const customCommon: (IKeycode & {value: number})[] = (customKeycodes ?? []).map((c, i) => ({
    name: c.name,
    title: c.title,
    shortName: c.shortName ?? c.name.split('\n')[0],
    code: `CUSTOM(${i})`,
    value: 0x7e00 + i,
  }));
  const baseKeys = filtered.filter((k) => !commonCodes.has(k.code) && !k.code.startsWith('MACRO'));
  const commonKeys = [...filtered.filter((k) => commonCodes.has(k.code) || k.code.startsWith('MACRO')), ...customCommon];
  const physicalKeys = useMemo(() => {
    if (active?.id !== 'basic' || query.trim()) return [];
    return PICKER_KEY_GEOMETRY.flatMap((geometry) => {
      const key = baseKeys.find((item) => item.code === geometry.code);
      return key ? [{key, geometry}] : [];
    });
  }, [active?.id, baseKeys, query]);

  const physicalLayout = active?.id === 'basic' && !query.trim();

  const renderKey = (
    k: (typeof filtered[number]) & {value?: number},
    i: number,
    geometry?: PickerKeyGeometry,
  ) => {
    const val = toByteValue(k);
    const icon = KEY_ICONS[k.code] ?? CUSTOM_KEY_ICONS[k.title ?? k.name.replace(/\n/g, ' ')];
    const label = KEY_LABELS[k.code] ?? k.shortName ?? k.name.split('\n')[0];
    const explanation = keycodeExplanation(k.code, k.title ?? k.name);
    const iconSprite = KEY_SPRITE_ICONS.has(icon ?? '') ? keySprite : navSprite;
    return (
      <KeyTooltip
        key={`${k.code}-${i}`}
        text={explanation}
        selected={val === currentValue}
        physical={Boolean(geometry)}
        keyWidth={geometry?.w}
        keyHeight={geometry?.h}
        x={geometry?.x}
        y={geometry?.y}
        onClick={() => onSelect(val)}
      >
        {icon ? <svg aria-hidden="true"><use href={`${iconSprite}#${icon}`} /></svg> : <KeyLabel>{label}</KeyLabel>}
      </KeyTooltip>
    );
  };

  return (
    <>
      <OptionListCart className="key-option-list-cart">
        {groups.map((g) => (
          <NavBtnItem
            key={g.id}
            $active={g.id === activeTab}
            onClick={() => setActiveTab(g.id)}
            title={CATEGORY_LABELS[g.id] ?? g.label}
          >
            <NavBtnIcon>
              <svg>
                <use href={`${navSprite}#${CATEGORY_ICONS[g.id] ?? 'SpecialCharacters'}`} />
              </svg>
            </NavBtnIcon>
            <NavBtnContent>
              <NavBtnName $active={g.id === activeTab}>
                {CATEGORY_LABELS[g.id] ?? g.label}
              </NavBtnName>
            </NavBtnContent>
          </NavBtnItem>
        ))}
        <SidebarSearchBox>
          <SearchIcon aria-hidden="true"><use href={`${navSprite}#search`} /></SearchIcon>
          <input
            placeholder="请输入想要查找的按钮"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </SidebarSearchBox>
      </OptionListCart>
      <KeyListBox className="key-list-box">
        <KeyContent>
          <KeyCard>
            <SectionHeader>{active?.label ?? ''}</SectionHeader>
            <KeyTableCard>
              <KeyGrid $physical={physicalLayout}>
                {physicalLayout
                  ? physicalKeys.map(({key, geometry}, i) => renderKey(key, i, geometry))
                  : baseKeys.map((key, i) => renderKey(key, i))}
              </KeyGrid>
            </KeyTableCard>
          </KeyCard>
          <KeyCard>
            <SectionHeader>常用字符</SectionHeader>
            <KeyTableCard>
              <KeyGrid>{commonKeys.map((key, i) => renderKey(key, i))}</KeyGrid>
            </KeyTableCard>
          </KeyCard>
        </KeyContent>
      </KeyListBox>
    </>
  );
};
