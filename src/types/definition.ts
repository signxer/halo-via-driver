// VIA 键盘定义 JSON 的类型(对齐 halo65-v2-via.json 结构)
// 完整结构见 @the-via/reader 的 VIADefinitionV3,这里只声明本项目用到的字段

export type KLEKey = {
  row: number;
  col: number;
  w: number;
  h: number;
  x: number; // 归一化 KLE 坐标(单位 u)
  y: number;
  xRaw?: number; // 原始 KLE 偏移(含连续 x 累计)
  yRaw?: number;
};

export type LayoutMap = {
  keymap: (string | Record<string, unknown>)[][];
  labels?: (string | string[])[];
  layoutOptions?: Record<string, Record<string, number[]>>;
};

export type MenuContentItem = {
  label: string;
  type?: 'range' | 'dropdown' | 'color' | 'text' | 'button';
  options?: (string | number)[];
  content?: unknown[];
  showIf?: string;
};

export type Menu = {
  label: string;
  content: (Menu | MenuContentItem)[];
};

export type CustomKeycode = {
  name: string;
  title?: string;
  shortName?: string;
};

export type Definition = {
  name: string;
  vendorId: string;
  productId: string;
  matrix: {rows: number; cols: number};
  layouts: {keymap: (string | Record<string, unknown>)[][]; labels?: (string | string[])[]};
  lighting?: string;
  customKeycodes?: CustomKeycode[];
  menus?: Menu[];
  keycodes?: string[];
};

// NuPhy 自定义键码的 VIA 键码起始值(VIA protocol >= 11)
export const CUSTOM_KEYCODE_START = 0x7e00;
