import React from 'react';
import styled from 'styled-components';

// ============================================================
// 层切换器 — 复刻原版 FN 分段按钮(selectDevice=5 实测)
// ul(flex, gap/pad 0.125rem) > li > button.btnInside
//   选中: bg black-86 白字 / 未选: bg white 黑字
//   尺寸 23×12px(2.6×1.35rem),radius 0.375rem,字号 0.75rem fw700
// ============================================================

const Wrap = styled.ul`
  display: flex;
  gap: 0.125rem;
  padding: 0.125rem;
  margin: 0;
  list-style: none;
  background: var(--background-canvas-overlay);
  border-radius: 0.375rem;
  align-items: center;
`;

const Item = styled.li`
  display: flex;
  list-style: none;
`;

const Btn = styled.button<{$active: boolean}>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.35rem; /* 12px */
  min-width: 2.6rem; /* 23px */
  padding: 0 0.25rem;
  border-radius: 0.375rem;
  font-size: 0.75rem; /* 6.67px */
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s ease;
  color: ${(p) => (p.$active ? '#fff' : 'var(--black-86)')};
  background: ${(p) =>
    p.$active ? 'var(--black-86)' : 'var(--white-100)'};
  &:hover {
    opacity: 0.85;
  }
`;

type LayerSwitcherProps = {
  layerCount: number;
  current: number;
  onChange: (layer: number) => void;
  layerOffset?: number;
};

export const LayerSwitcher: React.FC<LayerSwitcherProps> = ({
  layerCount, current, onChange, layerOffset = 0,
}) => {
  return (
    <Wrap>
      {Array.from({length: layerCount}, (_, i) => (
        <Item key={i}>
          <Btn $active={layerOffset + i === current} onClick={() => onChange(layerOffset + i)} title={`切换到 FN ${layerOffset + i}`}>
            FN {layerOffset + i}
          </Btn>
        </Item>
      ))}
    </Wrap>
  );
};
