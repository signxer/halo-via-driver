import {updateLighting} from './transport';
// WOBKEY Rainy 75 proprietary RGB protocol. This is NOT a VIA device.
const VID = 0x320f, PID = 0x5055, PAGE = 0xff1c, USAGE = 0x0092;
const REPORT_ID = 4;
// All effect IDs below are observed in original-driver USB captures 01-03.
// Device behaviour for each mode still requires user-side verification.
export const EFFECTS = [
  {id: 1, name: '波浪 · Wave'},
  {id: 2, name: '流云 · Cloud'},
  {id: 3, name: '旋涡 · Vortex'},
  {id: 4, name: '光谱 · Color Mix'},
  {id: 5, name: '呼吸 · Breathing'},
  {id: 6, name: '常亮 · Static'},
  {id: 7, name: '按键响应 · Reactive'},
  {id: 8, name: '涟漪 · Ripple'},
  {id: 9, name: '穿梭 · Traverse'},
  {id: 10, name: '星光 · Starlight'},
  {id: 11, name: '烟花 · Fireworks'},
  {id: 12, name: '滚动 · Rolling'},
  {id: 13, name: '波浪条 · Wave Bar'},
  {id: 14, name: '动画 · Cartoon'},
  {id: 15, name: '落雨 · Rainfall'},
  {id: 16, name: '扫描 · Scanner'},
  {id: 17, name: '众志成城 · ZZCC'},
  {id: 18, name: '极速 · Speed'},
  {id: 20, name: '关闭 · Off'},
] as const;
export type WobMode = typeof EFFECTS[number]['id'];
const CAPTURED_REPORT = '046805062700000000060304000000ff00000000002c01ff00ff0000ff00000000000000000402ff000000000000000000000000000000000000000000000000';
function fromHex(hex: string) { return Uint8Array.from(hex.match(/../g) ?? [], h => parseInt(h, 16)); }
function checksum(bytes: Uint8Array) {
  let total = 0;
  for (let i = 3; i < bytes.length; i++) total = (total + bytes[i]) & 0xffff;
  bytes[1] = total & 255; bytes[2] = total >> 8;
  return bytes;
}
export function isRainy(device: HIDDevice) {
  return device.vendorId === VID && device.productId === PID &&
    device.collections.some(c => c.usagePage === PAGE && c.usage === USAGE &&
      (c.outputReports ?? []).some(r => r.reportId === REPORT_ID));
}
export async function requestRainy() {
  if (!navigator.hid) throw new Error('WebHID unavailable: use Edge or Chrome on localhost.');
  const devices = await navigator.hid.requestDevice({filters: [{vendorId: VID, productId: PID, usagePage: PAGE, usage: USAGE}]});
  const device = devices.find(isRainy);
  if (!device) throw new Error('No Rainy 75 WOB RGB HID interface selected.');
  if (!device.opened) await device.open();
  return device;
}
export type WobBrightness = 0 | 1 | 2 | 3 | 4;
export type WobSpeed = 0 | 1 | 2 | 3 | 4;
export function makeReport(mode: WobMode, rgb: [number, number, number], brightness: WobBrightness = 4, speed: WobSpeed = 4) {
  if (!EFFECTS.some(e => e.id === mode)) throw new Error('Unsupported effect ID.');
  const bytes = fromHex(CAPTURED_REPORT);
  bytes[9] = mode;
  if (bytes.length !== 64 || bytes[0] !== REPORT_ID) throw new Error('Invalid captured report template.');
  if (![0, 1, 2, 3, 4].includes(brightness)) throw new Error('Unsupported brightness level.');
  bytes[10] = brightness;
  if (![0, 1, 2, 3, 4].includes(speed)) throw new Error('Unsupported speed level.');
  bytes[11] = speed;
  rgb.forEach((value, index) => { bytes[14 + index] = Math.max(0, Math.min(255, Math.round(value))); });
  return checksum(bytes);
}
export async function sendLighting(device: HIDDevice, mode: WobMode, rgb: [number, number, number], brightness: WobBrightness = 4, speed: WobSpeed = 4) {
  if (!device.opened || !isRainy(device)) throw new Error('Rainy 75 is not connected.');
  const bytes = makeReport(mode, rgb, brightness, speed);
  const commands=await updateLighting(device,mode,[bytes[14],bytes[15],bytes[16]],brightness,speed);
  return commands.map(command=>[REPORT_ID,...command].map(b=>b.toString(16).padStart(2,'0')).join(' ').toUpperCase()).join(' | ');
}
