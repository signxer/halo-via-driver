// 精简版设备类型(源自 the-via/app, GPL-3.0)
// 移除了对 Redux store / 3D 渲染等无关类型的依赖

export type DeviceInfo = {
  vendorId: number;
  productId: number;
  productName: string;
  protocol?: number;
};

export type Device = DeviceInfo & {
  path: string;
  productName: string;
  interface: number;
};

export type Keymap = number[];

export type WebVIADevice = Device & {
  _device: HIDDevice;
};

// 浏览器环境 WebHID 设备包装,模拟 node-hid 的 HID 接口
export type HIDDeviceLike = {
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  addEventListener(
    type: 'inputreport',
    listener: (event: {data: DataView; reportId: number}) => void,
  ): void;
};
