import React, {useCallback, useEffect, useState} from 'react';
import styled from 'styled-components';
import {KeyboardLayout} from '../components/KeyboardLayout';
import {NavTabs} from '../components/NavTabs';
import {LayerSwitcher} from '../components/LayerSwitcher';
import {KeycodePicker} from '../components/KeycodePicker';
import {useKeyboardStore} from '../store/keyboard';
import navSprite from '../assets/nuphy/icons/nav-symbols.svg?url';
import {useLocation} from 'react-router-dom';

// ============================================================
// 原版 PressKey 页面精确布局:
// .kbContentBac — 键盘区(居中,包含层切换器)
// .tabTopBacInside — 导航标签
//   .tabTop → .leftTab → li.selectedLi
// .tabBottomContent — 键码选择面板(bg: #f9f9f9, radius: 1.5rem, padding: 0.5rem)
//   .key-option-list-cart — 左侧分类列表
//   .key-list-box — 右侧键码网格
// ============================================================

const TabArea = styled.div`
  position: fixed;
  z-index: 11;
  left: 1.9rem;
  right: 1.9rem;
  bottom: 23.25rem;
  display: flex;
  flex-direction: column;
  width: auto;
  max-width: 112.5rem;
  height: 1.875rem;
  margin: 0 auto;
`;

const PanelArea = styled(TabArea)`
  position: fixed;
  z-index: 10;
  left: 1.9rem;
  right: 1.9rem;
  bottom: 0.5rem;
  width: auto;
  height: 23.25rem;
  margin: 0 auto;
`;

// 原版 myToolBac 工具栏(重置 + FN 层切换器)
const Toolbar = styled.div`
  position: relative;
  width: 54.8rem;
  height: 4.125rem;
  margin: 0 auto;
  padding: 0;
  & > ul {
    position: absolute;
    right: 0.5rem;
    top: 1rem;
  }
`;

const ResetBtn = styled.button`
  position: absolute;
  left: 46%;
  top: 1.12rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-black-l-title);
  cursor: pointer;
  padding: 0.25rem 0.45rem;
  width: 3.6rem;
  justify-content: center;
  border-radius: 0.375rem;
  background: var(--white-100);
  box-shadow: 0 1px 4px var(--black-4);
  transition: background 0.15s;
  &:hover {
    background: var(--black-4);
  }
  svg {
    width: 0.875rem;
    height: 0.875rem;
    fill: currentColor;
  }
`;

const TabBottomContent = styled.div<{$firstTab: boolean}>`
  display: flex;
  flex-direction: row;
  background: var(--surface-page);
  border-radius: ${(p) => (p.$firstTab ? '0 1.5rem 1.5rem 1.5rem' : '1.5rem')};
  padding: 0.5rem;
  gap: 0;
  /* 原版面板高度:206.67px = 23.25rem */
  height: 23.25rem;
  box-sizing: border-box;
`;

const EmptyHint = styled.div`
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 2.5rem;
  text-align: center;
`;

export const PressKeyPage: React.FC = () => {
  const location = useLocation();
  const {
    keys, keymap, currentLayer, layerCount, profile, definition, mode, model,
    setLayer, setKey, resetLayer, initDemo,
  } = useKeyboardStore();

  const cols = definition?.matrix.cols ?? 0;
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'disconnected') initDemo();
  }, []);

  const layer = keymap[currentLayer] ?? [];

  const handleKeyClick = useCallback((pos: string) => {
    setSelected(pos);
  }, []);

  const handleSelect = useCallback(async (val: number) => {
    if (!selected) return;
    const [r, c] = selected.split(',').map(Number);
    await setKey(currentLayer, r, c, val);
  }, [selected, currentLayer, setKey]);

  const currentValue = selected
    ? layer[(() => { const [r,c] = selected.split(',').map(Number); return r * cols + c; })()]
    : 0;

  if (keys.length === 0) {
    return <EmptyHint>加载键盘布局中…</EmptyHint>;
  }

  return (
    <>
      {/* 键盘区 */}
      <KeyboardLayout
        model={model}
        keys={keys} keymap={layer} cols={cols}
        customKeycodes={definition?.customKeycodes}
        selectedPos={selected}
        onKeyClick={handleKeyClick}
      />

      {/* 原版 myToolBac:重置 + FN 层切换器 */}
      <Toolbar>
        <ResetBtn onClick={() => resetLayer(currentLayer)} title="重置当前层"><svg viewBox="0 0 24 24"><use href={`${navSprite}#reset`} /></svg>重置</ResetBtn>
        <LayerSwitcher
          layerCount={Math.min(Math.max(layerCount - (profile === 'windows' ? 4 : 0), 0), 4)}
          current={currentLayer}
          layerOffset={profile === 'windows' ? 4 : 0}
          onChange={setLayer}
        />
      </Toolbar>

      {/* 导航标签 */}
      <TabArea>
        <NavTabs />
      </TabArea>

      {/* 键码选择面板(原版常驻显示,高度约 207px) */}
      <PanelArea>
        <TabBottomContent
          className="tabBottomContent"
          $firstTab={location.pathname === '/pressKey'}
        >
          <KeycodePicker
            customKeycodes={definition?.customKeycodes}
            currentValue={currentValue}
            onSelect={handleSelect}
          />
        </TabBottomContent>
      </PanelArea>
    </>
  );
};
