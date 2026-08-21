import React, {useMemo, useState, useEffect, useCallback} from 'react';
import styled from 'styled-components';
import {CAP_UNIT, KeyCap} from './KeyCap';
import {keycodeLabel, getKeycodeExplanation, type KeyLabelProfile} from '../utils/keycode';
import {useThemeStore} from '../store/theme';
import type {KLEKey, CustomKeycode} from '../types/definition';
import type {ModelConfig} from '../models';

// ============================================================
// 原版键盘组件 — 数据驱动
// - 底图随主题切换(light=empty1 白 / dark=empty2 黑)
// - 键帽绝对坐标取自型号配置(原版运行时提取的 rem 值)
// - 键盘随视口自适应缩放(同原版 keyboardScale 逻辑)
// ============================================================

const KbContentBac = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-top: 2.5467rem;
`;

const OutKeyBoardBac = styled.div`
  display: block;
`;

const BaseImg = styled.img`
  height: 100%;
  width: 100%;
  display: block;
  pointer-events: none;
`;

const SlideBac = styled.div`
  position: absolute;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
  }
`;

const CapLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
`;

const RainbowFrame = styled.div`
  position: absolute;
  z-index: 1;
  inset: .08rem;
  border: .12rem solid transparent;
  border-radius: 1.25rem;
  background:
    linear-gradient(#fff, #fff) padding-box,
    conic-gradient(from 250deg,
      rgba(255, 45, 45, .72),
      rgba(255, 219, 45, .68),
      rgba(67, 235, 112, .68),
      rgba(45, 198, 255, .68),
      rgba(112, 78, 255, .72),
      rgba(255, 45, 190, .68),
      rgba(255, 45, 45, .72)) border-box;
  -webkit-mask:
    linear-gradient(#000 0 0) padding-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  filter: none;
  pointer-events: none;
`;

const RainbowAura = styled(RainbowFrame)`
  z-index: 0;
  opacity: .72;
  /* 原版 .colorBacBorderB 的外圈发散光晕。 */
  filter: blur(.458092rem);
`;

const RainbowSlide = styled.div`
  position: absolute;
  z-index: 1;
  border-radius: .18rem;
  background: linear-gradient(90deg,
    rgba(8, 94, 255, .55),
    rgba(8, 255, 227, .7),
    rgba(8, 255, 57, .48),
    rgba(94, 255, 8, .52));
  filter: blur(.05rem) drop-shadow(0 0 .35rem rgba(8, 255, 180, .48));
  pointer-events: none;
`;

type KeyboardLayoutProps = {
  model: ModelConfig;
  keys: KLEKey[];
  keymap: number[];
  cols: number;
  customKeycodes?: CustomKeycode[];
  selectedPos?: string | null;
  onKeyClick?: (pos: string) => void;
  interactive?: boolean;
  lightingPreview?: boolean;
  hostProfile?: KeyLabelProfile;
  children?: React.ReactNode;
};

export const KeyboardLayout: React.FC<KeyboardLayoutProps> = ({
  model,
  keys, keymap, cols, customKeycodes,
  selectedPos, onKeyClick, interactive = true, children,
  lightingPreview = false, hostProfile = 'mac',
}) => {
  const theme = useThemeStore((s) => s.theme);
  const [scale, setScale] = useState(1);
  // 原版 Halo65 的键盘底图尺寸：54.9138rem × 19.8125rem。
  // VIA 型号配置以图片原始坐标(58.125rem × 20.9711rem)记录，
  // 这里使用同一比例还原到原版实际 rem 尺寸。
  const geometryScale = 0.9447535;

  const {width: BOARD_W, height: BOARD_H} = model.board;
  const baseImg = theme === 'dark' ? model.board.imageDark : model.board.imageLight;
  const kleLayout = model.kleLayout ?? {
    originX: 0,
    originY: 0,
    unitX: CAP_UNIT,
    unitY: CAP_UNIT,
  };

  // 键帽坐标:优先型号配置,缺省回退 KLE 归一化坐标
  const caps = useMemo(() => {
    if (keys.length === 0) return [];
    return keys.map((k, i) => {
      const original = model.keyLayout[i] ?? [
        kleLayout.originX + k.x * kleLayout.unitX,
        kleLayout.originY + k.y * kleLayout.unitY,
        k.w,
        k.h,
      ];
      return {
        row: k.row, col: k.col,
        x: original[0], y: original[1],
        w: original[2], h: original[3],
      };
    });
  }, [keys, model]);

  // 原版自适应缩放(实测校准,永不超过原始尺寸):
  //   scale = min(1, (innerHeight - 284) / 345)
  // 对照原版驱动:1440x900→1.0, 1280x720→0.85, 1024x700→0.79
  // (284 ≈ fixTop22 + myToolBac37 + tabTopBac223 + 余量;345 = 原版 imgObj 高)
  // visualViewport 用于浏览器调试栏/地址栏收起后没有触发 window.resize 的场景。
  const computeScale = useCallback(() => {
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const s = Math.min(1, Math.max(0.3, (vh - 284) / 345));
    setScale(s);
  }, []);

  useEffect(() => {
    computeScale();
    window.addEventListener('resize', computeScale);
    window.visualViewport?.addEventListener('resize', computeScale);
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(computeScale)
      : null;
    observer?.observe(document.documentElement);
    return () => {
      window.removeEventListener('resize', computeScale);
      window.visualViewport?.removeEventListener('resize', computeScale);
      observer?.disconnect();
    };
  }, [computeScale]);

  return (
    <KbContentBac className="kbContentBac">
      {children}
      <OutKeyBoardBac
        id="outKeyBoardBac"
        style={{width: `${BOARD_W * geometryScale * scale}rem`, height: `${BOARD_H * geometryScale * scale}rem`}}
      >
        <div
          id="myKeyBoardBac"
          style={{
            width: `${BOARD_W * geometryScale}rem`,
            height: `${BOARD_H * geometryScale}rem`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
          }}
        >
          <BaseImg src={baseImg} alt={model.name} draggable={false} />
          {lightingPreview && <RainbowAura aria-hidden="true" />}
          {lightingPreview && <RainbowFrame aria-hidden="true" />}
          {model.board.slide && model.board.slideImage && (
            <SlideBac
              style={{
                width: `${model.board.slide.w * geometryScale}rem`,
                height: `${model.board.slide.h * geometryScale}rem`,
                left: `${model.board.slide.x * geometryScale}rem`,
                top: `${model.board.slide.y * geometryScale}rem`,
              }}
            >
              <img src={model.board.slideImage} alt="" draggable={false} />
              {lightingPreview && <RainbowSlide aria-hidden="true" style={{inset: 0}} />}
            </SlideBac>
          )}
          <CapLayer>
            {caps.map((c, i) => {
              const idx = c.row * cols + c.col;
              const val = keymap[idx] ?? 0;
              const pos = `${c.row},${c.col}`;
              const label = pos === '4,10' && val >= 0x7e00
                ? 'FN1'
                : keycodeLabel(val, customKeycodes, hostProfile);
              const sub = val >= 0x7e00 && label !== 'FN1' ? `C${val - 0x7e00 + 1}` : undefined;
              const rainbowHue = ((c.x / Math.max(BOARD_W, 1)) * 300 + (c.y / Math.max(BOARD_H, 1)) * 10) % 360;
              const lightingColor = lightingPreview
                ? `hsl(${rainbowHue.toFixed(1)} 100% 58%)`
                : undefined;
              return (
                <KeyCap
                  key={`${c.row}-${c.col}-${i}`}
                  w={c.w * geometryScale} h={c.h * geometryScale}
                  x={c.x * geometryScale} y={c.y * geometryScale}
                  unitScale={geometryScale}
                  label={label || ''} subLabel={sub}
                  tooltip={getKeycodeExplanation(val, customKeycodes, hostProfile)}
                  activeColor={lightingColor}
                  selected={selectedPos === pos}
                  disabled={!interactive}
                  onClick={interactive ? () => onKeyClick?.(pos) : undefined}
                />
              );
            })}
          </CapLayer>
        </div>
      </OutKeyBoardBac>
    </KbContentBac>
  );
};
