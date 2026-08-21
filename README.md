# NuPhy Halo V2 VIA Web Driver

基于 **VIA 协议 + WebHID** 的 NuPhy Halo 系列网页驱动，界面按照 NuPhy 官方驱动页面复刻，并支持以下三种键盘自动识别：

- NuPhy Halo65 V2
- NuPhy Halo75 V2
- NuPhy Halo96 V2

> 在线体验：部署到 Vercel 后，将下面的地址替换为实际部署地址。
>
> **[打开在线驱动 DEMO](https://your-project.vercel.app/?demo=1)**

## 功能

- 通过 USB WebHID 连接真实键盘
- 根据 USB VID/PID 自动识别 Halo65、Halo75 或 Halo96
- 自动加载对应 VIA JSON、键盘矩阵、层数、键位布局和键盘底图
- 按键定义：修改基础键、多媒体键、灯效键、特殊键和自定义键码
- Mac / Windows Layer 切换
- 宏管理：读取、编辑和保存宏
- 灯效设置：效果、亮度、速度、方向和颜色等 VIA 支持的参数
- 设置页、IO 手册、主题切换和设备状态显示
- 未连接键盘时可以使用演示模式浏览界面

## 支持的设备

| 设备 | VID | PID | VIA 定义 |
| --- | --- | --- | --- |
| Halo65 V2 | `0x19F5` | `0x3315`，兼容官方 `0x102F` | [`halo65-v2.json`](public/definitions/halo65-v2.json) |
| Halo75 V2 | `0x19F5` | `0x32F5` | [`halo75-v2.json`](public/definitions/halo75-v2.json) |
| Halo96 V2 | `0x19F5` | `0x3302` | [`halo96-v2.json`](public/definitions/halo96-v2.json) |

连接时无需手动选择键盘型号。点击「授权连接」后，浏览器授权 WebHID 设备，驱动会根据 VID/PID 自动加载相应配置。已经授权过的设备在重新打开页面时会自动尝试连接。

## 在线体验

Vercel 可以直接部署这个 Vite 项目：

1. 将项目上传到 GitHub。
2. 在 Vercel 中导入该 GitHub 仓库。
3. 使用以下构建配置：

   - Install Command：`npm ci`
   - Build Command：`npm run build`
   - Output Directory：`dist`

4. 部署完成后，将 Vercel 地址写回本 README 的「在线体验」链接。

在线体验必须使用 HTTPS，并建议使用最新版 Chrome 或 Edge，因为 WebHID 需要安全上下文。

## 本地运行

```bash
npm ci
npm run dev
```

然后打开 <http://localhost:5173>。

生产构建：

```bash
npm run build
npm run preview
```

## 演示模式

演示模式不需要连接键盘，仅用于浏览页面和检查布局：

```text
http://localhost:5173/?demo=1&device=halo65-v2#/pressKey
http://localhost:5173/?demo=1&device=halo75-v2#/pressKey
http://localhost:5173/?demo=1&device=halo96-v2#/pressKey
```

演示模式中的修改只保存在浏览器内存中，不会写入真实键盘。

## 项目结构

```text
src/
  models/index.ts             三种设备的型号注册、VID/PID 和底图配置
  store/keyboard.ts           WebHID 连接、自动识别和 VIA 状态管理
  via/                        VIA 协议层
  pages/                      按键、灯效、宏和设置页面
  components/                 顶栏、键盘、键帽和键码选择器
  theme/                      NuPhy 风格主题变量
public/
  definitions/                三种设备的 VIA JSON
  img/                        Halo65、Halo75、Halo96 底图资源
vercel.json                   Vercel 构建配置
```

新增型号时，通常只需要添加 VIA JSON、底图资源，并在 [`src/models/index.ts`](src/models/index.ts) 注册型号，不需要修改 VIA 页面和协议代码。

## 技术栈

- Vite
- React 19
- TypeScript
- Zustand
- styled-components
- WebHID
- VIA / QMK Dynamic Keymap 协议

## 开发检查

```bash
npm run build
```

构建产物位于 `dist/`，该目录已经加入 `.gitignore`。

## 许可证与资源说明

`src/via/` 包含从 [the-via/app](https://github.com/the-via/app) 抽取的 VIA 协议代码，遵循 GPL-3.0。

NuPhy 的界面设计、键盘底图和品牌资源归 NuPhy 所有。本项目用于个人学习、兼容性研究和本地设备配置，请遵守相关授权和商标规定。
