// VIA 协议层统一出口
// 代码源自 the-via/app (GPL-3.0),按需抽取并解耦了 Redux 依赖
export {KeyboardAPI, canConnect, KeyboardValue} from './keyboard-api';
export {PROTOCOL_ALPHA, PROTOCOL_BETA, PROTOCOL_GAMMA} from './keyboard-api';
export {HID, tryForgetDevice} from './shim-hid';
export {scanDevices, initAndConnectDevice} from './usb-hid';
export type {
  Device,
  DeviceInfo,
  Keymap,
  WebVIADevice,
} from './types';
export {getMacroAPI, getMacroValidator, isDelaySupported} from './macro-api';
export {getBasicKeyDict} from './key-to-byte/dictionary-store';
export {getByteToKey} from './key';
export type {IKeycode, IKeycodeMenu} from './key';
