// 中文语言包(NuPhy 原版 drive.nuphyio.com 提取)
// 来源:i18n/zh-CN.json —— 原版所有界面中文文案
import zh from './zh-CN.json';

export type Locale = typeof zh;

export const messages = zh;

// Halo65 HE 原版键位数据使用的是完整键码名(例如 KC_ENTER)，而 VIA
// 定义通常使用 QMK 缩写(KC_ENT)。这里保留原版 KeyCodeTip 文案，并只
// 做一次明确的键码别名转换，避免再根据截图猜 tooltip 内容。
const KEY_CODE_TIPS = messages.KeyCodeTip as Record<string, string>;
const KEY_CODE_NAMES = messages.KeyName as Record<string, string>;
const ORIGINAL_KEYCODE_ALIAS: Record<string, string> = {
  KC_ENT: 'KC_ENTER', KC_BSPC: 'KC_BACKSPACE', KC_CAPS: 'KC_CAPS_LOCK',
  KC_DEL: 'KC_DELETE', KC_PSCR: 'KC_PRINT_SCREEN', KC_INS: 'KC_INSERT',
  KC_PGUP: 'KC_PAGE_UP', KC_PGDN: 'KC_PAGE_DOWN', KC_GRV: 'KC_GRAVE',
  KC_MINS: 'KC_MINUS', KC_EQL: 'KC_EQUAL', KC_LBRC: 'KC_LEFT_BRACKET',
  KC_RBRC: 'KC_RIGHT_BRACKET', KC_BSLS: 'KC_BACKSLASH', KC_COMM: 'KC_COMMA',
  KC_SCLN: 'KC_SEMICOLON', KC_QUOT: 'KC_QUOTE', KC_SLSH: 'KC_SLASH',
  KC_SPC: 'KC_SPACE', KC_LGUI: 'KC_LWIN', KC_RGUI: 'KC_RWIN',
  KC_LALT: 'KC_LALT', KC_RALT: 'KC_RALT', KC_NLCK: 'KC_NUM_LOCK',
  KC_P1: 'KC_KP_1', KC_P2: 'KC_KP_2', KC_P3: 'KC_KP_3', KC_P4: 'KC_KP_4',
  KC_P5: 'KC_KP_5', KC_P6: 'KC_KP_6', KC_P7: 'KC_KP_7', KC_P8: 'KC_KP_8',
  KC_P9: 'KC_KP_9', KC_P0: 'KC_KP_0', KC_PDOT: 'KC_KP_DOT',
  KC_PENT: 'KC_KP_ENTER', KC_PSLS: 'KC_KP_SLASH', KC_PAST: 'KC_KP_ASTERISK',
  KC_PMNS: 'KC_KP_MINUS', KC_PPLS: 'KC_KP_PLUS', KC_MNXT: 'KC_MEDIA_NEXT',
  KC_MPRV: 'KC_MEDIA_PREV', KC_MSTP: 'KC_MEDIA_STOP', KC_MPLY: 'KC_PLAY',
  KC_MSEL: 'KC_MEDIA_PLAYER', KC_CALC: 'KC_CALCULATOR', KC_MYCM: 'KC_MY_COMPUTER',
  KC_SLEP: 'KC_SLEEP', KC_VOLU: 'KC_VOLUME_UP', KC_VOLD: 'KC_VOLUME_DOWN',
  KC_RGHT: 'KC_RIGHT',
};

export function keycodeExplanation(code: string, fallback = ''): string {
  const canonical = ORIGINAL_KEYCODE_ALIAS[code] ?? code;
  return KEY_CODE_TIPS[canonical] ?? KEY_CODE_NAMES[canonical] ??
    KEY_CODE_TIPS[code] ?? KEY_CODE_NAMES[code] ?? fallback;
}

// 灯效中文名映射(ColorPage)
export type EffectKey = keyof typeof messages.ColorPage;

// 获取灯效中文名
export function effectName(key: string): string {
  const cp = messages.ColorPage as Record<string, string>;
  return cp[key] ?? key;
}

// 导航标签
export const navLabels = {
  performance: messages.KBSetTitleBar.Performance, // 触发设置
  remap: messages.KBSetTitleBar.Remap, // 按键定义
  advanced: messages.KBSetTitleBar.AdvancedFunctions, // 高级按键
  color: messages.KBSetTitleBar.Color, // 灯效设置
  macro: messages.KBSetTitleBar.Macro, // 宏键设置
  gamepad: messages.KBSetTitleBar.GamepadMode, // 模拟手柄
  modeSetting: messages.KBSetTitleBar.ModeSetting, // 模式设置
} as const;

// 按键定义页分区标签
export const remapLabels = {
  basic: messages.RemapPage.BasicCharacters, // 基本字符
  media: messages.RemapPage.MultimediaCharacters ?? '多媒体字符', // 多媒体字符
  lighting: messages.RemapPage.LightCharacters ?? '灯效字符', // 灯效字符
  special: messages.RemapPage.SpecialCharacters, // 特殊字符
  macro: messages.RemapPage.Macro, // 宏
  common: messages.RemapPage.CommonlyUsedCharacters, // 常用字符
  createNew: messages.RemapPage.CreateNewKey, // 新建按键
  bindList: messages.RemapPage.BindKeyList, // 绑定列表
} as const;

// 灯效列表(原版 lightType 顺序 → 中文名)
// 来自原版 drive.nuphyio.com 的 lightType 图标排序
export type LightingEffect = {
  key: string; // VIA/QMK 效果索引
  name: string; // ColorPage i18n key
  zh: string; // 中文名
  color: boolean; // 可调色
  speed: boolean; // 可调速
  direction?: boolean; // 可调方向
};

const CP = messages.ColorPage as Record<string, string>;

export const LIGHTING_EFFECTS: LightingEffect[] = [
  {key: '0', name: 'LM_Spectrum', zh: CP.LM_Spectrum, color: true, speed: true},
  {key: '1', name: 'LM_Staircase', zh: CP.LM_Staircase, color: true, speed: true},
  {key: '2', name: 'LM_Static', zh: CP.LM_Static, color: true, speed: false},
  {key: '3', name: 'LM_Breathing', zh: CP.LM_Breathing, color: true, speed: true},
  {key: '4', name: 'LM_HundredFlowers', zh: CP.LM_HundredFlowers, color: true, speed: true},
  {key: '5', name: 'LM_Wave', zh: CP.LM_Wave, color: true, speed: true, direction: true},
  {key: '6', name: 'LM_UpAndDownWave', zh: CP.LM_UpAndDownWave, color: true, speed: true, direction: true},
  {key: '7', name: 'LM_Fountain', zh: CP.LM_Fountain, color: true, speed: true},
  {key: '8', name: 'LM_Galaxy', zh: CP.LM_Galaxy, color: true, speed: true},
  {key: '9', name: 'LM_Rotation', zh: CP.LM_Rotation, color: true, speed: true, direction: true},
  {key: '10', name: 'LM_Tide', zh: CP.LM_Tide, color: true, speed: true},
  {key: '11', name: 'LM_SeaWave', zh: CP.LM_SeaWave, color: true, speed: true},
  {key: '12', name: 'LM_Ripple', zh: CP.LM_Ripple, color: true, speed: true},
  {key: '13', name: 'LM_ConstantRipple', zh: CP.LM_ConstantRipple, color: true, speed: true},
  {key: '14', name: 'LM_SinglePoint', zh: CP.LM_SinglePoint, color: true, speed: false},
  {key: '15', name: 'LM_Grid', zh: CP.LM_Grid, color: true, speed: true},
  {key: '16', name: 'LM_Piano', zh: CP.LM_Piano, color: true, speed: true},
  {key: '17', name: 'LM_FlowingLight', zh: CP.LM_FlowingLight, color: true, speed: true, direction: true},
  {key: '18', name: 'LM_FallingRain', zh: CP.LM_FallingRain, color: true, speed: true},
  {key: '19', name: 'LM_WaveBand', zh: CP.LM_WaveBand, color: true, speed: true},
  {key: '20', name: 'LM_Breathe', zh: CP.LM_Breathe, color: true, speed: true},
  {key: '21', name: 'LM_Neon', zh: CP.LM_Neon, color: true, speed: true},
  {key: '22', name: 'LM_Custom', zh: CP.LM_Custom, color: true, speed: false},
  {key: '23', name: 'LM_TwoColorCircle', zh: CP.LM_TwoColorCircle, color: true, speed: true},
  {key: '24', name: 'LM_Gaming', zh: CP.LM_Gaming, color: true, speed: true},
  {key: '25', name: 'LM_Identify', zh: CP.LM_Identify, color: true, speed: false},
] as const;

// 灯区(原版)
export const LIGHT_ZONES = [
  {key: 'Backlight', zh: CP.Backlight},
  {key: 'Sidelight', zh: CP.Sidelight},
  {key: 'DecorativeLamp', zh: CP.DecorativeLamp},
  {key: 'FrontLight', zh: CP.FrontLight},
] as const;

// 灯效面板控制项中文名
export const LIGHT_CONTROLS = {
  brightness: CP.Brightness,
  colorPreset: CP.ColorPreset,
  changeSpeed: CP.ChangeSpeed,
  changeDirection: CP.ChangeDirection,
  gear: CP.Gear,
  lightingColor: CP.LightingColor,
} as const;
