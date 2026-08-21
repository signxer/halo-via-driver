// ============================================================
// 型号注册表 — 数据驱动,支持扩展
//
// 以后新增键盘型号只需:
//   1. 把 VIA 定义 JSON 放到 public/definitions/<id>.json
//   2. 把键盘底图放到 public/img/<id>/  (empty1=浅色, empty2=深色, slide1=推杆图)
//   3. 在下方 MODELS 数组加一条配置
// 无需改动任何页面/协议代码。
// ============================================================

// 键帽绝对坐标(rem):[left, top, widthUnits, heightUnits]
// 顺序必须与 KLE 解析结果一一对应(见 utils/kle.ts)
export type KeyPosition = [number, number, number, number];

export type ModelConfig = {
  id: string; // 唯一 id,同时是 definition JSON 与 img 目录名
  name: string; // 展示名(设备名)
  vendorId: number; // USB vendorId(十进制)
  productIds: number[]; // USB productId(十进制),支持同型号不同固件
  definitionUrl: string; // public 下的 VIA 定义 JSON
  layerCount: number; // 固件 dynamic_keymap.layer_count
  board: {
    width: number; // rem
    height: number; // rem
    imageLight: string; // 浅色底图(白)
    imageDark: string; // 深色底图(黑)
    slideImage?: string; // 顶部推杆/滑块图
    slide?: {x: number; y: number; w: number; h: number}; // rem
  };
  keyLayout: KeyPosition[]; // 与 KLE 顺序一致；空数组表示使用 VIA KLE 坐标
  kleLayout?: {
    originX: number;
    originY: number;
    unitX: number;
    unitY: number;
  };
};

// Halo Lite/V2 三个布局共用 NuPhy 的键帽间距；具体按键数量和行列
// 由各自 VIA JSON 提供，避免把 65 的坐标误套到 75/96 上。
const HALO_LITE_KLE_LAYOUT = {
  originX: 1.3717,
  originY: 2.3754,
  unitX: 3.4795,
  unitY: 3.4795,
};

// ============================================================
// Halo65 V2 (QMK + VIA, VID 0x19F5 / PID 0x3315)
// 底图来自原版驱动 Halo65 Lite 系列(white/black 两色)
// ============================================================

const HALO65_V2_KEY_LAYOUT: KeyPosition[] = [
  // Row 0
  [1.3717, 2.3754, 1.0, 1.0], [4.8512, 2.3754, 1.0, 1.0], [8.3307, 2.3754, 1.0, 1.0],
  [11.8102, 2.3754, 1.0, 1.0], [15.2897, 2.3754, 1.0, 1.0], [18.7692, 2.3754, 1.0, 1.0],
  [22.2487, 2.3754, 1.0, 1.0], [25.7282, 2.3754, 1.0, 1.0], [29.2077, 2.3754, 1.0, 1.0],
  [32.6872, 2.3754, 1.0, 1.0], [36.1667, 2.3754, 1.0, 1.0], [39.6462, 2.3754, 1.0, 1.0],
  [43.1257, 2.3754, 1.0, 1.0], [46.6052, 2.3754, 2.0, 1.0], [53.4304, 2.3754, 1.0, 1.0],
  // Row 1
  [1.3717, 5.8549, 1.5, 1.0], [6.5241, 5.8549, 1.0, 1.0], [10.0036, 5.8549, 1.0, 1.0],
  [13.4831, 5.8549, 1.0, 1.0], [16.9626, 5.8549, 1.0, 1.0], [20.4421, 5.8549, 1.0, 1.0],
  [23.9216, 5.8549, 1.0, 1.0], [27.4011, 5.8549, 1.0, 1.0], [30.8806, 5.8549, 1.0, 1.0],
  [34.3601, 5.8549, 1.0, 1.0], [37.8396, 5.8549, 1.0, 1.0], [41.3191, 5.8549, 1.0, 1.0],
  [44.7986, 5.8549, 1.0, 1.0], [48.2781, 5.8549, 1.5, 1.0], [53.4304, 5.8549, 1.0, 1.0],
  // Row 2
  [1.3717, 9.3344, 1.8, 1.0], [7.5278, 9.3344, 1.0, 1.0], [11.0073, 9.3344, 1.0, 1.0],
  [14.4868, 9.3344, 1.0, 1.0], [17.9663, 9.3344, 1.0, 1.0], [21.4458, 9.3344, 1.0, 1.0],
  [24.9253, 9.3344, 1.0, 1.0], [28.4048, 9.3344, 1.0, 1.0], [31.8843, 9.3344, 1.0, 1.0],
  [35.3638, 9.3344, 1.0, 1.0], [38.8433, 9.3344, 1.0, 1.0], [42.3228, 9.3344, 1.0, 1.0],
  [45.8023, 9.3344, 2.25, 1.0], [53.4638, 9.3344, 1.0, 1.0],
  // Row 3
  [1.3717, 12.8139, 2.3, 1.0], [9.2006, 12.8139, 1.0, 1.0], [12.6801, 12.8139, 1.0, 1.0],
  [16.1596, 12.8139, 1.0, 1.0], [19.6391, 12.8139, 1.0, 1.0], [23.1186, 12.8139, 1.0, 1.0],
  [26.5981, 12.8139, 1.0, 1.0], [30.0776, 12.8139, 1.0, 1.0], [33.5571, 12.8139, 1.0, 1.0],
  [37.0366, 12.8139, 1.0, 1.0], [40.5161, 12.8139, 1.0, 1.0], [43.9956, 12.8139, 1.75, 1.0],
  [49.9843, 12.8139, 1.0, 1.0], [53.4638, 12.8139, 1.0, 1.0],
  // Row 4
  [1.3717, 16.2934, 1.25, 1.0], [5.6876, 16.2934, 1.25, 1.0], [10.0036, 16.2934, 1.25, 1.0],
  [14.3195, 16.2934, 6.5, 1.0], [36.2002, 16.2934, 1.25, 1.0], [40.5161, 16.2934, 1.25, 1.0],
  [46.5048, 16.2934, 1.0, 1.0], [49.9843, 16.2934, 1.0, 1.0], [53.4638, 16.2934, 1.0, 1.0],
];

export const HALO65_V2: ModelConfig = {
  id: 'halo65-v2',
  name: 'NuPhy Halo65 V2',
  vendorId: 0x19f5,
  // 官方 drive.nuphyio.com 的 Halo65 V2(IO)为 0x102F;
  // 提供的 VIA JSON(对应 codeberg halo65_v2 固件)为 0x3315 —— 两种都支持
  productIds: [0x3315, 0x102f],
  definitionUrl: '/definitions/halo65-v2.json',
  layerCount: 8, // 固件 dynamic_keymap.layer_count
  board: {
    width: 58.125,
    height: 20.9711,
    // 原版 Halo65Lite/V2 的底图，而不是 Halo65HE 的 A65_empty 图。
    imageLight: '/img/halo65-v2/halo65-lite-empty1.webp',
    imageDark: '/img/halo65-v2/halo65-lite-empty2.webp',
    slideImage: '/img/halo65-v2/halo65-lite-slide1.webp',
    slide: {x: 1.33342, y: 1.03037, w: 3.39416, h: 0.30305},
  },
  keyLayout: HALO65_V2_KEY_LAYOUT,
};

export const HALO75_V2: ModelConfig = {
  id: 'halo75-v2',
  name: 'NuPhy Halo75 V2',
  vendorId: 0x19f5,
  productIds: [0x32f5],
  definitionUrl: '/definitions/halo75-v2.json',
  layerCount: 8,
  board: {
    width: 58.125,
    height: 24.4307,
    imageLight: '/img/halo75-lite/halo75-lite-empty1.webp',
    imageDark: '/img/halo75-lite/halo75-lite-empty2.webp',
    slideImage: '/img/halo65-v2/halo65-lite-slide1.webp',
    slide: {x: 1.33203, y: 0.93848, w: 3.63281, h: 0.36328},
  },
  keyLayout: [],
  kleLayout: HALO_LITE_KLE_LAYOUT,
};

export const HALO96_V2: ModelConfig = {
  id: 'halo96-v2',
  name: 'NuPhy Halo96 V2',
  vendorId: 0x19f5,
  productIds: [0x3302],
  definitionUrl: '/definitions/halo96-v2.json',
  layerCount: 8,
  board: {
    width: 68.7813,
    height: 24.5215,
    imageLight: '/img/halo96-lite/halo96-lite-empty1.webp',
    imageDark: '/img/halo96-lite/halo96-lite-empty2.webp',
    slideImage: '/img/halo65-v2/halo65-lite-slide1.webp',
    slide: {x: 1.33203, y: 0.93848, w: 3.63281, h: 0.36328},
  },
  keyLayout: [],
  kleLayout: HALO_LITE_KLE_LAYOUT,
};

export const MODELS: ModelConfig[] = [HALO65_V2, HALO75_V2, HALO96_V2];

// 当前激活型号(单型号产品;扩展时改成按设备/选择切换)
export const ACTIVE_MODEL_ID: string = HALO65_V2.id;

export function getModel(id: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getActiveModel(): ModelConfig {
  return getModel(ACTIVE_MODEL_ID) ?? HALO65_V2;
}

export function getModelForDevice(vendorId: number, productId: number): ModelConfig | undefined {
  return MODELS.find((model) =>
    model.vendorId === vendorId && model.productIds.includes(productId),
  );
}
