import {create} from 'zustand';
import type {Definition, KLEKey} from '../types/definition';
import {parseKLE} from '../utils/kle';
import {KeyboardAPI, HID} from '../via';
import {getActiveModel, getModel, getModelForDevice, type ModelConfig} from '../models';
import defaultKeymap from '../models/default-keymap.json';

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

const buildDemoKeymap = (rows: number, cols: number, layerCount: number): number[][] => {
  const keymap: number[][] = [];
  for (let l = 0; l < layerCount; l++) {
    keymap.push(new Array(rows * cols).fill(0x00));
  }
  // 第 0 层使用 NuPhy 页面相同的 Halo65 默认层，保证演示页和真实设备的
  // 键帽文字/位置都可直接做像素对照。
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
      const keymap = buildDemoKeymap(rows, cols, layerCount);
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
    set({profile, currentLayer: profile === 'windows' ? 4 : 0});
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
