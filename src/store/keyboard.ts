import {create} from 'zustand';
import type {Definition, KLEKey} from '../types/definition';
import {parseKLE} from '../utils/kle';
import {KeyboardAPI, HID} from '../via';
import {getActiveModel, getModel, getModelForDevice, type ModelConfig} from '../models';
import defaultKeymap from '../models/default-keymap.json';
import {getBasicKeyDict} from '../via/key-to-byte/dictionary-store';
import {getByteForCode} from '../via/key';

export type ConnectionMode = 'disconnected' | 'demo' | 'connected';
export type HostProfile = 'mac' | 'windows';

type KeyboardState = {
  mode: ConnectionMode;
  connecting: boolean;
  error: string | null;

  model: ModelConfig;
  definition: Definition | null;
  keys: KLEKey[]; // 由 KLE 解析出的键盘布局
  api: KeyboardAPI | null;
  deviceName: string | null;

  protocolVersion: number;
  layerCount: number;
  currentLayer: number;
  profile: HostProfile;
  // keymap[layer] 为 number[] 矩阵顺序(rows*cols),-1 表示未加载
  keymap: number[][];

  // actions
  initDemo: () => Promise<void>;
  connect: () => Promise<void>;
  tryAutoConnect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  setLayer: (layer: number) => void;
  setProfile: (profile: HostProfile) => void;
  readKeymap: (layer: number) => Promise<void>;
  setKey: (layer: number, row: number, col: number, val: number) => Promise<void>;
  resetLayer: (layer: number) => Promise<void>;
  setError: (msg: string | null) => void;
};

const loadDefinition = async (model: ModelConfig): Promise<Definition> => {
  const res = await fetch(model.definitionUrl);
  if (!res.ok) throw new Error('无法加载键盘定义文件');
  return (await res.json()) as Definition;
};

type DemoLayout = string[][];

// Halo75V2/Halo96V2 的默认 ANSI 层来自公开的 NuPhy QMK keymap.c。
// 这里按 VIA JSON 的 KLE 顺序保存，之后再映射回真实的 matrix row/col，
// 不再把 Halo65 的矩阵硬套到另外两个型号上。
const HALO75_MAC: DemoLayout = [
  ['KC_ESC','KC_BRMD','KC_BRMU','MAC_TASK','MAC_SEARCH','MAC_VOICE','MAC_DND','KC_MPRV','KC_MPLY','KC_MNXT','KC_MUTE','KC_VOLD','KC_VOLU','MAC_PRTA','KC_INS','KC_DEL'],
  ['KC_GRV','KC_1','KC_2','KC_3','KC_4','KC_5','KC_6','KC_7','KC_8','KC_9','KC_0','KC_MINS','KC_EQL','KC_BSPC','KC_HOME'],
  ['KC_TAB','KC_Q','KC_W','KC_E','KC_R','KC_T','KC_Y','KC_U','KC_I','KC_O','KC_P','KC_LBRC','KC_RBRC','KC_BSLS','KC_END'],
  ['KC_CAPS','KC_A','KC_S','KC_D','KC_F','KC_G','KC_H','KC_J','KC_K','KC_L','KC_SCLN','KC_QUOT','KC_ENT','KC_PGUP'],
  ['KC_LSFT','KC_Z','KC_X','KC_C','KC_V','KC_B','KC_N','KC_M','KC_COMM','KC_DOT','KC_SLSH','KC_RSFT','KC_UP','KC_PGDN'],
  ['KC_LCTL','KC_LOPT','KC_LCMD','KC_SPC','KC_RCMD','MO(1)','KC_LEFT','KC_DOWN','KC_RIGHT'],
];

const HALO75_WIN: DemoLayout = [
  ['KC_ESC','KC_F1','KC_F2','KC_F3','KC_F4','KC_F5','KC_F6','KC_F7','KC_F8','KC_F9','KC_F10','KC_F11','KC_F12','WIN_PRTA','KC_INS','KC_DEL'],
  HALO75_MAC[1], HALO75_MAC[2], HALO75_MAC[3],
  ['KC_LSFT','KC_Z','KC_X','KC_C','KC_V','KC_B','KC_N','KC_M','KC_COMM','KC_DOT','KC_SLSH','KC_RSFT','KC_UP','KC_PGDN'],
  ['KC_LCTL','KC_LWIN','KC_LALT','KC_SPC','KC_RALT','MO(3)','KC_LEFT','KC_DOWN','KC_RIGHT'],
];

const HALO96_MAC: DemoLayout = [
  ['KC_ESC','KC_SCRL','KC_PAUSE','MAC_TASK','MAC_SEARCH','MAC_VOICE','MAC_DND','KC_MPRV','KC_MPLY','KC_MNXT','KC_MUTE','KC_VOLD','KC_VOLU','MAC_PRTA','KC_DEL','KC_HOME','KC_END','KC_PGUP','KC_PGDN'],
  ['KC_GRV','KC_1','KC_2','KC_3','KC_4','KC_5','KC_6','KC_7','KC_8','KC_9','KC_0','KC_MINS','KC_EQL','KC_BSPC','KC_NUM','KC_PSLS','KC_PAST','KC_PMNS'],
  ['KC_TAB','KC_Q','KC_W','KC_E','KC_R','KC_T','KC_Y','KC_U','KC_I','KC_O','KC_P','KC_LBRC','KC_RBRC','KC_BSLS','KC_P7','KC_P8','KC_P9','KC_PPLS'],
  ['KC_CAPS','KC_A','KC_S','KC_D','KC_F','KC_G','KC_H','KC_J','KC_K','KC_L','KC_SCLN','KC_QUOT','KC_ENT','KC_P4','KC_P5','KC_P6'],
  ['KC_LSFT','KC_Z','KC_X','KC_C','KC_V','KC_B','KC_N','KC_M','KC_COMM','KC_DOT','KC_SLSH','KC_RSFT','KC_UP','KC_P1','KC_P2','KC_P3','KC_PENT'],
  ['KC_LCTL','KC_LALT','KC_LGUI','KC_SPC','KC_RGUI','MO(1)','KC_LEFT','KC_DOWN','KC_RGHT','KC_P0','KC_PDOT'],
];

const HALO96_WIN: DemoLayout = [
  ['KC_ESC','KC_F1','KC_F2','KC_F3','KC_F4','KC_F5','KC_F6','KC_F7','KC_F8','KC_F9','KC_F10','KC_F11','KC_F12','WIN_PRTA','KC_DEL','KC_HOME','KC_END','KC_PGUP','KC_PGDN'],
  HALO96_MAC[1], HALO96_MAC[2], HALO96_MAC[3],
  ['KC_LSFT','KC_Z','KC_X','KC_C','KC_V','KC_B','KC_N','KC_M','KC_COMM','KC_DOT','KC_SLSH','KC_RSFT','KC_UP','KC_P1','KC_P2','KC_P3','KC_PENT'],
  ['KC_LCTL','KC_LGUI','KC_LALT','KC_SPC','KC_RALT','MO(3)','KC_LEFT','KC_DOWN','KC_RGHT','KC_P0','KC_PDOT'],
];

const DEMO_ALIASES: Record<string, string> = {
  KC_BRMD: 'KC_BRID', KC_BRMU: 'KC_BRIU', KC_SCRL: 'KC_SLCK', KC_PAUSE: 'KC_PAUS',
  KC_NUM: 'KC_NLCK', KC_RIGHT: 'KC_RGHT', KC_LWIN: 'KC_LGUI', KC_RWIN: 'KC_RGUI',
  KC_LOPT: 'KC_LALT', KC_LCMD: 'KC_LGUI', KC_RCMD: 'KC_RGUI',
};

const DEMO_CUSTOM_VALUES: Record<string, number> = {
  RF_DFU: 0x7e00, LNK_USB: 0x7e01, LNK_RF: 0x7e02, LNK_BLE1: 0x7e03, LNK_BLE2: 0x7e04, LNK_BLE3: 0x7e05,
  MAC_TASK: 0x7e06, MAC_SEARCH: 0x7e07, MAC_VOICE: 0x7e08, MAC_DND: 0x7e0a,
  WIN_PRTA: 0x7e0b, MAC_PRTA: 0x7e0c, DEV_RESET: 0x7e0d, SLEEP_MODE: 0x7e0e, BAT_SHOW: 0x7e0f,
};

const demoKeycodeToByte = (() => {
  const dict = getBasicKeyDict(12, 13);
  return (code: string): number => {
    if (code === '_______') return 0;
    if (DEMO_CUSTOM_VALUES[code] !== undefined) return DEMO_CUSTOM_VALUES[code];
    const normalized = DEMO_ALIASES[code] ?? code;
    try {
      return getByteForCode(normalized, dict);
    } catch {
      return 0;
    }
  };
})();

const applyOrderedDemoLayout = (
  keymap: number[][],
  layer: number,
  layout: DemoLayout,
  keys: KLEKey[],
  cols: number,
) => {
  const ordered = layout.flat();
  if (ordered.length !== keys.length) {
    console.warn(`[demo-keymap] layout/key count mismatch: ${ordered.length} vs ${keys.length}`);
  }
  ordered.forEach((code, index) => {
    const key = keys[index];
    if (!key || !keymap[layer]) return;
    keymap[layer][key.row * cols + key.col] = demoKeycodeToByte(code);
  });
};

const buildDemoKeymap = (
  rows: number,
  cols: number,
  layerCount: number,
  keys: KLEKey[],
  modelId: string,
): number[][] => {
  const keymap: number[][] = [];
  for (let l = 0; l < layerCount; l++) {
    keymap.push(new Array(rows * cols).fill(0x00));
  }
  if (modelId === 'halo75-v2' || modelId === 'halo96-v2') {
    const mac = modelId === 'halo75-v2' ? HALO75_MAC : HALO96_MAC;
    const windows = modelId === 'halo75-v2' ? HALO75_WIN : HALO96_WIN;
    applyOrderedDemoLayout(keymap, 0, mac, keys, cols);
    // 页面将 0–2 作为 Mac 层、3–5 作为 Windows 层；6–7 是固件保留层，
    // 不在页面中展示。把 QMK 的 Windows 基础层放到 Windows 组的首层。
    if (layerCount > 3) applyOrderedDemoLayout(keymap, 3, windows, keys, cols);
    return keymap;
  }

  // Halo65 保留现有官方 JSON 对应的演示矩阵。
  const demoRows: Record<number, Array<[number, number]>> = {
    0: [[0,0x29],[1,0x1e],[2,0x1f],[3,0x20],[4,0x21],[5,0x22],[6,0x23],[7,0x24],[8,0x25],[9,0x26],[10,0x27],[11,0x2d],[12,0x2e],[13,0x2a],[15,0x4c]],
    1: [[0,0x2b],[1,0x14],[2,0x1a],[3,0x08],[4,0x15],[5,0x17],[6,0x1c],[7,0x18],[8,0x0c],[9,0x12],[10,0x13],[11,0x2f],[12,0x30],[13,0x31],[15,0x4a]],
    2: [[0,0x39],[1,0x04],[2,0x16],[3,0x07],[4,0x09],[5,0x0a],[6,0x0b],[7,0x0d],[8,0x0e],[9,0x0f],[10,0x33],[11,0x34],[13,0x28],[15,0x4b]],
    3: [[0,0xe1],[2,0x1d],[3,0x1b],[4,0x06],[5,0x19],[6,0x05],[7,0x11],[8,0x10],[9,0x36],[10,0x37],[11,0x38],[13,0xe5],[14,0x52],[15,0x4e]],
    4: [[0,0xe0],[1,0xe2],[2,0xe3],[6,0x2c],[9,0xe3],[10,0x7e05],[13,0x50],[14,0x51],[15,0x4f]],
  };
  const demoMap: Record<string, number> = {};
  Object.entries(demoRows).forEach(([row, entries]) => entries.forEach(([col, val]) => {
    demoMap[`${row},${col}`] = val;
  }));
  Object.entries(demoMap).forEach(([pos, val]) => {
    const [r, c] = pos.split(',').map(Number);
    keymap[0][r * cols + c] = val;
  });
  return keymap;
};

const createApiAndLoad = async (model: ModelConfig, path: string) => {
  const api = new KeyboardAPI(path);
  const protocolVersion = await api.getProtocolVersion();
  if (protocolVersion < 0) {
    throw new Error('键盘未响应,请确认键盘处于 VIA 模式(QMK 固件)');
  }
  const layerCount = await api.getLayerCount();
  const definition = await loadDefinition(model);
  const keys = parseKLE(definition.layouts.keymap);

  const rows = definition.matrix.rows;
  const cols = definition.matrix.cols;
  const keymap: number[][] = [];
  for (let l = 0; l < layerCount; l++) {
    const m = await api.readRawMatrix({rows, cols}, l);
    keymap.push(m);
  }

  return {api, protocolVersion, layerCount, definition, keys, keymap};
};

export const useKeyboardStore = create<KeyboardState>((set, get) => ({
  mode: 'disconnected',
  connecting: false,
  error: null,
  model: getActiveModel(),
  definition: null,
  keys: [],
  api: null,
  deviceName: null,
  protocolVersion: -1,
  layerCount: 4,
  currentLayer: 0,
  profile: 'mac',
  keymap: [],

  initDemo: async () => {
    try {
      // 方便在没有实体键盘时逐个检查三种底图/布局：
      // ?device=halo65-v2、?device=halo75-v2 或 ?device=halo96-v2。
      const requestedId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('device')
        : null;
      const model = (requestedId ? getModel(requestedId) : undefined) ?? get().model;
      const definition = await loadDefinition(model);
      const keys = parseKLE(definition.layouts.keymap);
      const layerCount = model.layerCount;
      const {rows, cols} = definition.matrix;
      const keymap = buildDemoKeymap(rows, cols, layerCount, keys, model.id);
      set({
        definition,
        keys,
        model,
        mode: 'demo',
        keymap,
        layerCount,
        protocolVersion: 12, // Halo65 V2 固件 VIA_PROTOCOL_VERSION = 0x000C
        profile: 'mac',
        api: null,
        deviceName: null,
        error: null,
      });
    } catch (e: any) {
      set({error: `演示模式初始化失败: ${e?.message ?? e}`});
    }
  },

  connect: async () => {
    set({connecting: true, error: null});
    try {
      // 先请求所有 VIA HID 设备，再根据 VID/PID 自动选择对应型号。
      // 这样同一页面可以连接 Halo65、Halo75 或 Halo96，不需要手动切换型号。
      const devices = await HID.devices(true);
      const device = devices.find((d) => Boolean(getModelForDevice(d.vendorId, d.productId)));
      const model = device ? getModelForDevice(device.vendorId, device.productId) : undefined;
      if (!device || !model) {
        throw new Error('未找到支持的 Halo65 / Halo75 / Halo96 键盘,请确认已通过 USB 连接并切到有线模式');
      }
      const loaded = await createApiAndLoad(model, device.path);
      set({
        mode: 'connected',
        model,
        api: loaded.api,
        definition: loaded.definition,
        keys: loaded.keys,
        protocolVersion: loaded.protocolVersion,
        layerCount: loaded.layerCount,
        currentLayer: 0,
        profile: 'mac',
        keymap: loaded.keymap,
        deviceName: device.productName ?? model.name,
        connecting: false,
        error: null,
      });
    } catch (e: any) {
      set({connecting: false, error: e?.message ?? String(e)});
      throw e;
    }
  },

  // 已授权设备自动连接(打开页面时调用,不弹授权窗)
  tryAutoConnect: async () => {
    try {
      const devices = await HID.getAuthorizedDevices();
      const device = devices.find((d) => Boolean(getModelForDevice(d.vendorId, d.productId)));
      const model = device ? getModelForDevice(device.vendorId, device.productId) : undefined;
      if (!device || !model) return false;
      const loaded = await createApiAndLoad(model, device.path);
      set({
        mode: 'connected',
        model,
        api: loaded.api,
        definition: loaded.definition,
        keys: loaded.keys,
        protocolVersion: loaded.protocolVersion,
        layerCount: loaded.layerCount,
        currentLayer: 0,
        profile: 'mac',
        keymap: loaded.keymap,
        deviceName: device.productName ?? model.name,
        connecting: false,
        error: null,
      });
      return true;
    } catch (e: any) {
      console.warn('[auto-connect]', e);
      return false;
    }
  },

  disconnect: async () => {
    set({mode: 'disconnected', api: null, keymap: [], deviceName: null, error: null});
  },

  setError: (msg) => {
    set({error: msg});
  },

  setLayer: (layer) => {
    set({currentLayer: layer});
  },

  setProfile: (profile) => {
    set({profile, currentLayer: profile === 'windows' ? 3 : 0});
  },

  readKeymap: async (layer) => {
    const {api, definition, keymap} = get();
    if (!api || !definition) return;
    const {rows, cols} = definition.matrix;
    const m = await api.readRawMatrix({rows, cols}, layer);
    const next = [...keymap];
    next[layer] = m;
    set({keymap: next});
  },

  setKey: async (layer, row, col, val) => {
    const {api, definition, keymap, mode} = get();
    if (!definition) return;
    const {rows, cols} = definition.matrix;
    const next = [...keymap];
    if (!next[layer]) next[layer] = new Array(rows * cols).fill(0);
    next[layer] = [...next[layer]];
    next[layer][row * cols + col] = val;
    set({keymap: next});
    // 真实设备写入
    if (mode === 'connected' && api) {
      try {
        await api.setKey(layer, row, col, val);
      } catch (e: any) {
        set({error: `写入失败: ${e?.message ?? e}`});
      }
    }
  },

  // 重置当前层为固件默认键位(来自官方 keymap.c)。
  // 目前仓库内只有 Halo65 的官方默认层；75/96 不得把 65 的矩阵
  // 或空矩阵写回设备，否则会造成不可逆的误清空。
  resetLayer: async (layer) => {
    const {api, definition, keymap, mode, model} = get();
    if (!definition) return;
    const {rows, cols} = definition.matrix;
    const def = defaultKeymap[layer];
    if (!def || def.length !== rows * cols) {
      set({error: `${model.name} 暂未内置官方默认键位，未执行重置`});
      return;
    }
    const next = [...keymap];
    next[layer] = [...def];
    set({keymap: next});
    if (mode === 'connected' && api) {
      try {
        await api.writeRawMatrix({rows, cols}, [next[layer]]);
      } catch (e: any) {
        set({error: `重置失败: ${e?.message ?? e}`});
      }
    }
  },
}));
