// 源自 the-via/app (GPL-3.0),精简:去掉 usb-detection 桌面依赖
import {HID} from './shim-hid';
import type {Device, WebVIADevice} from './types';

export {HID} from './shim-hid';

export async function scanDevices(
  forceRequest: boolean,
): Promise<WebVIADevice[]> {
  return HID.devices(forceRequest);
}

// TODO: fix typing. This actually returns a HID object, but it complains if you type it as such.
export function initAndConnectDevice({path}: Pick<Device, 'path'>): Device {
  const device = new HID.HID(path);
  return device;
}
