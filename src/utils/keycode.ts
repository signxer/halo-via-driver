// 键码工具:字节 ↔ 键码名转换、键码面板分组数据
import {getBasicKeyDict} from '../via/key-to-byte/dictionary-store';
import {getByteToKey, getCodeForByte, getLabelForByte} from '../via/key';
import {keycodesList, type IKeycode} from '../via/key';
import {CUSTOM_KEYCODE_START} from '../types/definition';
import type {CustomKeycode} from '../types/definition';
import {keycodeExplanation} from '../i18n';

// 全局键码字典(protocol 12 + keycodes v13,适用于 Halo65 的 VIA 协议)
const protocol = 12;
const basicDict = getBasicKeyDict(protocol, 13);
const byteToKey = getByteToKey(basicDict);

// 键帽标签:原版字形(如 "!\n1"、"~`"、"Esc"),CSS 负责大写
export function keycodeLabel(keycode: number, custom: CustomKeycode[] = []): string {
  if (keycode === 0x00) return '';
  // NuPhy 自定义键码
  if (keycode >= CUSTOM_KEYCODE_START) {
    const idx = keycode - CUSTOM_KEYCODE_START;
    const c = custom[idx];
    if (c) return c.name.split('\n')[0];
    return `C${idx + 1}`;
  }
  const label = getLabelForByte(keycode, 100, basicDict, byteToKey);
  if (!label || label.startsWith('0x')) return label ?? '';
  const physicalLabels: Record<string, string> = {
    Esc: 'ESC', Bksp: 'BACKSPACE', Del: 'DEL', Tab: 'TAB',
    Caps: 'CAPS', Enter: 'ENTER', PgUp: 'PGUP', PgDn: 'PGDN',
    LShft: 'SHIFT', RShft: 'SHIFT', LCtl: 'CTRL', RCtl: 'CTRL',
    LWin: 'CMD', RWin: 'CMD', LAlt: 'OPT', RAlt: 'OPT', Space: 'SPACE',
  };
  return physicalLabels[label] ?? label;
}

export function getKeycodeName(keycode: number, custom: CustomKeycode[] = []): string {
  if (keycode === 0x00) return '空(无动作)';
  if (keycode >= CUSTOM_KEYCODE_START) {
    const idx = keycode - CUSTOM_KEYCODE_START;
    const c = custom[idx];
    if (c) return c.title ?? c.name.replace(/\n/g, ' ');
    return `自定义键码 ${idx + 1}`;
  }
  const name = getCodeForByte(keycode, basicDict, byteToKey);
  if (!name || name.startsWith('0x')) return `未定义 (${name ?? '?'})`;
  return name.replace(/^KC_/, '');
}

/** 直接复用 NuPhy Halo65 HE 原版 KeyCodeTip 文案。 */
export function getKeycodeExplanation(keycode: number, custom: CustomKeycode[] = []): string {
  if (keycode >= CUSTOM_KEYCODE_START) {
    const idx = keycode - CUSTOM_KEYCODE_START;
    const c = custom[idx];
    return c?.title ?? c?.name.replace(/\n/g, ' ') ?? `自定义键码 ${idx + 1}`;
  }
  const code = getCodeForByte(keycode, basicDict, byteToKey);
  return keycodeExplanation(code ?? '', keycodeLabel(keycode, custom));
}

// 键码面板分组
export type KeycodeGroup = {
  id: string;
  label: string;
  keycodes: IKeycode[];
};

export function buildKeycodeGroups(custom: CustomKeycode[] = []): KeycodeGroup[] {
  const groups: KeycodeGroup[] = [];
  const all = keycodesList;

  // 基本字符:字母、数字、标点、导航、功能键、数字键盘、修饰键
  const basicCodes = new Set([
    'KC_A', 'KC_B', 'KC_C', 'KC_D', 'KC_E', 'KC_F',
    'KC_G', 'KC_H', 'KC_I', 'KC_J', 'KC_K', 'KC_L', 'KC_M', 'KC_N',
    'KC_O', 'KC_P', 'KC_Q', 'KC_R', 'KC_S', 'KC_T', 'KC_U', 'KC_V',
    'KC_W', 'KC_X', 'KC_Y', 'KC_Z',
    'KC_1', 'KC_2', 'KC_3', 'KC_4', 'KC_5', 'KC_6', 'KC_7', 'KC_8', 'KC_9', 'KC_0',
    'KC_ENT', 'KC_ESC', 'KC_BSPC', 'KC_TAB', 'KC_SPC',
    'KC_MINS', 'KC_EQL', 'KC_LBRC', 'KC_RBRC', 'KC_BSLS', 'KC_NUHS',
    'KC_SCLN', 'KC_QUOT', 'KC_GRV', 'KC_COMM', 'KC_DOT', 'KC_SLSH',
    'KC_CAPS', 'KC_LEFT', 'KC_DOWN', 'KC_UP', 'KC_RGHT',
    'KC_HOME', 'KC_END', 'KC_PGUP', 'KC_PGDN', 'KC_DEL',
    'KC_LCTL', 'KC_LSFT', 'KC_LALT', 'KC_LGUI',
    'KC_RCTL', 'KC_RSFT', 'KC_RALT', 'KC_RGUI',
    'KC_PSCR', 'KC_INS', 'KC_SLCK', 'KC_PAUS', 'KC_MENU',
    'KC_MUTE', 'KC_VOLU', 'KC_VOLD', 'KC_MNXT', 'KC_MPRV', 'KC_MSTP',
    'KC_MPLY', 'KC_MSEL', 'KC_EJCT', 'KC_MAIL', 'KC_CALC', 'KC_MYCM',
    'KC_WWW_SEARCH', 'KC_WWW_HOME', 'KC_WWW_BACK', 'KC_WWW_FORWARD',
    'KC_WWW_STOP', 'KC_WWW_REFRESH', 'KC_WWW_FAVORITES', 'KC_SLEP', 'KC_WAKE',
  ]);
  // 功能键 + 数字键盘
  const fnCodes = new Set(
    Array.from({length: 12}, (_, i) => `KC_F${i + 1}`),
  );
  const numpadCodes = new Set([
    'KC_NLCK', 'KC_PSLS', 'KC_PAST', 'KC_PMNS', 'KC_PPLS', 'KC_PENT',
    'KC_P1', 'KC_P2', 'KC_P3', 'KC_P4', 'KC_P5', 'KC_P6',
    'KC_P7', 'KC_P8', 'KC_P9', 'KC_P0', 'KC_PDOT',
  ]);
  const basicOrder = [
    'KC_ESC',
    ...Array.from({length: 12}, (_, i) => `KC_F${i + 1}`),
    'KC_PSCR', 'KC_DEL', 'KC_HOME', 'KC_END', 'KC_PGUP', 'KC_PGDN',
    'KC_GRV', 'KC_1', 'KC_2', 'KC_3', 'KC_4', 'KC_5', 'KC_6', 'KC_7', 'KC_8', 'KC_9', 'KC_0',
    'KC_MINS', 'KC_EQL', 'KC_BSPC', 'KC_NLCK', 'KC_PSLS', 'KC_PAST', 'KC_PMNS', 'KC_PPLS',
    'KC_TAB', 'KC_Q', 'KC_W', 'KC_E', 'KC_R', 'KC_T', 'KC_Y', 'KC_U', 'KC_I', 'KC_O', 'KC_P',
    'KC_LBRC', 'KC_RBRC', 'KC_BSLS', 'KC_CAPS',
    'KC_A', 'KC_S', 'KC_D', 'KC_F', 'KC_G', 'KC_H', 'KC_J', 'KC_K', 'KC_L', 'KC_SCLN', 'KC_QUOT', 'KC_ENT',
    'KC_LSFT', 'KC_NUHS', 'KC_Z', 'KC_X', 'KC_C', 'KC_V', 'KC_B', 'KC_N', 'KC_M', 'KC_COMM', 'KC_DOT', 'KC_SLSH', 'KC_RSFT',
    'KC_LCTL', 'KC_LGUI', 'KC_LALT', 'KC_SPC', 'KC_RALT', 'KC_RGUI', 'KC_APP', 'KC_RCTL',
    'KC_LEFT', 'KC_DOWN', 'KC_UP', 'KC_RGHT',
    'KC_INS', 'KC_SLCK', 'KC_PAUS', 'KC_MENU',
    'KC_MUTE', 'KC_VOLU', 'KC_VOLD', 'KC_MNXT', 'KC_MPRV', 'KC_MSTP', 'KC_MPLY',
    'KC_MSEL', 'KC_EJCT', 'KC_MAIL', 'KC_CALC', 'KC_MYCM', 'KC_WWW_SEARCH',
    'KC_WWW_HOME', 'KC_WWW_BACK', 'KC_WWW_FORWARD', 'KC_WWW_STOP',
    'KC_WWW_REFRESH', 'KC_WWW_FAVORITES', 'KC_SLEP', 'KC_WAKE',
    'KC_P7', 'KC_P8', 'KC_P9', 'KC_P4', 'KC_P5', 'KC_P6', 'KC_P1', 'KC_P2', 'KC_P3', 'KC_P0', 'KC_PDOT', 'KC_PENT',
  ];
  const order = new Map(basicOrder.map((code, index) => [code, index]));
  const orderedBasic = all.filter((k) => basicCodes.has(k.code) || fnCodes.has(k.code) || numpadCodes.has(k.code))
    .sort((a, b) => (order.get(a.code) ?? 9999) - (order.get(b.code) ?? 9999));
  groups.push({
    id: 'basic',
    label: '基本字符',
    keycodes: orderedBasic,
  });

  // 多媒体字符
  const mediaCodes = new Set([
    'KC_MUTE', 'KC_VOLU', 'KC_VOLD', 'KC_MNXT', 'KC_MPRV',
    'KC_MSTP', 'KC_MPLY', 'KC_MSEL', 'KC_EJCT', 'KC_MAIL',
    'KC_CALC', 'KC_MYCM', 'KC_WWW_SEARCH', 'KC_WWW_HOME',
    'KC_WWW_BACK', 'KC_WWW_FORWARD', 'KC_WWW_STOP', 'KC_WWW_REFRESH',
    'KC_WWW_FAVORITES', 'KC_MFFD', 'KC_MRWD', 'KC_PWR', 'KC_SLEP', 'KC_WAKE',
  ]);
  groups.push({
    id: 'media',
    label: '多媒体字符',
    keycodes: all.filter((k) => mediaCodes.has(k.code)),
  });

  // 灯效字符:RGB / 背光控制
  const lightingCodes = all.filter((k) =>
    /^(BL_|BR_|RGB_|RM_|UG_)/.test(k.code),
  );
  groups.push({
    id: 'lighting',
    label: '灯效字符',
    keycodes: lightingCodes,
  });

  // 特殊字符:层控制、高级键码
  const layerCodes = all.filter(
    (k) =>
      k.code === 'KC_TRNS' ||
      k.code === 'KC_NO' ||
      k.code.startsWith('MO(') ||
      k.code.startsWith('LT(') ||
      k.code.startsWith('TO(') ||
      k.code.startsWith('TG(') ||
      k.code.startsWith('TT(') ||
      k.code.startsWith('OSL(') ||
      k.code.startsWith('DF(') ||
      k.code.startsWith('QK_LAYER') ||
      k.code.startsWith('MT(') ||
      k.code.startsWith('LM(') ||
      k.code.startsWith('OSM('),
  );
  groups.push({id: 'special', label: '特殊字符', keycodes: layerCodes});

  // 宏 + NuPhy 自定义键码
  const macroCodes = all.filter((k) => k.code.startsWith('MACRO'));
  const keycodes = [...macroCodes];
  if (custom.length > 0) {
    keycodes.push(
      ...custom.map((c, i) => ({
        code: `CUSTOM(${i})`,
        name: c.name.replace(/\n/g, ' '),
        title: c.title ?? c.name.replace(/\n/g, ' '),
        shortName: c.name.split('\n')[0],
        value: CUSTOM_KEYCODE_START + i,
      })),
    );
  }
  groups.push({id: 'macro', label: '宏', keycodes});

  return groups;
}

// 自定义键码数组 → 字节值
export function customKeycodeValue(index: number): number {
  return CUSTOM_KEYCODE_START + index;
}
