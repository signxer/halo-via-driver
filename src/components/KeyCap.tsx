import React from 'react';
import styled, {css} from 'styled-components';
import VectorLeft from '../assets/nuphy/Vector_left.svg?url';
import VectorMiddle from '../assets/nuphy/Vector_middle.svg?url';
import VectorRight from '../assets/nuphy/Vector_right.svg?url';

// ============================================================
// 像素级复刻键帽 (提取自原版)
// .boxBacOut — pos absolute, w/h 3.34567rem, no padding/margin
//   .wireframeBac — flex space-between
//     mask divs — bg: var(--keyboard-single-key), mask 100% 100%
//   .boxBac — flex, fw 900, font 6.46507px (0.727rem), padding 0 3.56872px
//     .bestTopBox
//     label div — text-align center
//       p.ellipsis — block, overflow hidden, text-overflow ellipsis
// ============================================================

// 保留旧版键帽的物理像素尺寸；根字号改为 NuPhy 的视口缩放后同步缩小 rem 单位。
export const CAP_UNIT = 3.34567;

type KeyCapProps = {
  label: string;
  subLabel?: string;
  w: number;
  h: number;
  x: number; // left in rem
  y: number; // top in rem
  selected?: boolean;
  disabled?: boolean;
  activeColor?: string;
  /** Rendered width of one physical 1U unit after keyboard geometry scaling. */
  unitScale?: number;
  onClick?: (e: React.MouseEvent) => void;
  tooltip?: string;
};

const BoxBacOut = styled.div<{
  $x: number; $y: number; $w: number; $h: number;
  $selected: boolean; $disabled: boolean; $lighting: boolean;
}>`
  position: absolute;
  width: ${(p) => p.$w * CAP_UNIT}rem;
  height: ${(p) => p.$h * CAP_UNIT}rem;
  left: ${(p) => p.$x}rem;
  top: ${(p) => p.$y}rem;
  margin: 0;
  display: block;

  ${(p) =>
    p.$selected &&
    css`
      filter: drop-shadow(0 0 4px rgba(0, 222, 176, 0.28));
      z-index: 2;
      &::after {
        content: '';
        position: absolute;
        inset: 0.05rem;
        border: 1px dashed var(--theme-color);
        border-radius: 0.28rem;
        background: rgba(0, 222, 176, 0.08);
        pointer-events: none;
      }
    `}

  ${(p) =>
    !p.$disabled &&
    css`
      cursor: pointer;
      &:hover {
        opacity: 0.85;
      }
    `}
`;

const LightingGlow = styled.div`
  position: absolute;
  inset: .2rem;
  border-radius: .45rem;
  background: var(--lighting-color);
  /* 原版 bottomBoxA：颜色本身带 alpha，并使用约 .229rem 模糊。 */
  filter: blur(.229046rem);
  opacity: .38;
  pointer-events: none;
`;

const LightingFace = styled.div`
  position: absolute;
  inset: .16rem;
  border-radius: .38rem;
  /* 原版 bottomBoxB 是纯白，发光只从键帽边缘透出。 */
  background: var(--keyboard-background);
  box-shadow: inset 0 0 .08rem rgba(255,255,255,.9);
  pointer-events: none;
`;

const WireframeBac = styled.div<{$baseWidth: number}>`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  position: absolute;
  align-items: center;
  z-index: 1;
  pointer-events: none;
  > div:first-child,
  > div:last-child {
    /* NuPhy source: each side is keyWidth / 2.6. The middle piece is
       the only piece that expands for 1.25U/1.5U/2U/spacebar keys. */
    flex: 0 0 ${(p) => p.$baseWidth / 2.6}rem;
    width: ${(p) => p.$baseWidth / 2.6}rem;
  }
  > div:nth-child(2) {
    flex: 1 1 auto;
  }
`;

const MaskSeg: React.FC<{image: string; color?: string}> = ({image, color}) => (
  <div
    style={{
      backgroundColor: color || 'var(--keyboard-single-key)',
      height: '100%',
      maskImage: `url("${image}")`,
      WebkitMaskImage: `url("${image}")`,
      maskSize: '100% 100%',
      WebkitMaskSize: '100% 100%',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
    }}
  />
);

const BoxBac = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  pointer-events: none;
  font-weight: 900;
  font-size: 0.687139rem;
  line-height: 1.15;
  padding: 0 0.379301rem; /* 原版 .boxBac 的精确 rem 值 */
`;

const BestTopBox = styled.div`
  display: block;
`;

const LabelDiv = styled.div<{$width: number}>`
  min-width: ${(p) => `${p.$width}rem`};
  width: ${(p) => `${p.$width}rem`};
  text-align: center;
`;

const Elipsis = styled.p`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
  margin: 0;
  font-size: 0.687139rem;
  font-weight: 900;
  color: var(--keyboard-text-l-black);
  line-height: 1.15;
  text-align: center;
  text-transform: uppercase;
`;

export const KeyCap: React.FC<KeyCapProps> = ({
  label, subLabel, w, h, x, y,
  selected, disabled, activeColor, unitScale = 1, onClick,
  tooltip,
}) => {
  // 原版:多行标签拆成多个 p.ellipsis(如 "!\n1" → ! 与 1 两行)
  const lines = label.split('\n');
  // 原版文字区会随着物理键宽扩展，不能让 BACKSPACE/ENTER/SHIFT
  // 共用 1U 的固定宽度，否则会被 ellipsis 截断。
  const labelWidth = Math.max(1.67204, w * CAP_UNIT - 1.4888);
  return (
    <BoxBacOut
      $w={w} $h={h} $x={x} $y={y}
      $selected={!!selected} $disabled={!!disabled} $lighting={!!activeColor}
      onClick={onClick}
      title={tooltip || (subLabel ? `${label} ${subLabel}` : label)}
      className="boxBacOut"
    >
      {activeColor && <LightingGlow style={{'--lighting-color': activeColor} as React.CSSProperties} />}
      {activeColor && <LightingFace />}
      <div style={{width: '100%', height: '100%'}}>
        <WireframeBac className="wireframeBac" $baseWidth={CAP_UNIT * unitScale}>
          <MaskSeg image={VectorLeft} color={activeColor} />
          <MaskSeg image={VectorMiddle} color={activeColor} />
          <MaskSeg image={VectorRight} color={activeColor} />
        </WireframeBac>
        <BoxBac className="boxBac">
          <BestTopBox className="bestTopBox" />
          <LabelDiv $width={labelWidth}>
            {lines.map((l, i) => (
              <Elipsis key={i} className="ellipsis">{l}</Elipsis>
            ))}
            {subLabel && <Elipsis className="ellipsis">{subLabel}</Elipsis>}
          </LabelDiv>
        </BoxBac>
      </div>
    </BoxBacOut>
  );
};
