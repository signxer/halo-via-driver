import React from 'react';
import styled from 'styled-components';
import {useLocation} from 'react-router-dom';
import {KeyboardLayout} from './KeyboardLayout';
import {LayerSwitcher} from './LayerSwitcher';
import {useKeyboardStore} from '../store/keyboard';
import navSprite from '../assets/nuphy/icons/nav-symbols.svg?url';

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const Toolbar = styled.div`
  position: relative;
  /* 与按键定义页 PressKeyPage.Toolbar 保持同一宽度和定位基准。 */
  width: 54.8rem;
  height: 4.125rem;
  margin: 0 auto;
  & > ul { position: absolute; right: .5rem; top: 1rem; }
`;

const ResetButton = styled.button`
  position: absolute;
  left: 46%;
  top: 1.12rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .25rem;
  width: 3.6rem;
  padding: .25rem .45rem;
  box-sizing: border-box;
  background: var(--button-inactive-background);
  box-shadow: 0 1px 4px var(--black-4);
  cursor: pointer;
  transition: background 0.15s;
  color: var(--text-black-l-title);
  font-size: .75rem;
  font-weight: 700;
  border-radius: .375rem;
  svg { width: .875rem; height: .875rem; fill: currentColor; }
  &:hover { background: var(--surface-hover); }
`;

type DeviceHeaderProps = {
  showControls?: boolean;
};

export const DeviceHeader: React.FC<DeviceHeaderProps> = ({showControls = true}) => {
  const location = useLocation();
  const {keys, keymap, currentLayer, layerCount, profile, definition, model, setLayer, resetLayer} = useKeyboardStore();
  const layer = keymap[currentLayer] ?? [];
  const cols = definition?.matrix.cols ?? 0;
  return (
    <Header className="device-header">
      <KeyboardLayout
        model={model}
        keys={keys}
        keymap={layer}
        cols={cols}
        customKeycodes={definition?.customKeycodes}
        selectedPos={null}
        onKeyClick={() => undefined}
        lightingPreview={location.pathname === '/light'}
      />
      {showControls && (
        <Toolbar>
          <ResetButton onClick={() => resetLayer(currentLayer)} title="重置当前层">
            <svg viewBox="0 0 24 24"><use href={`${navSprite}#reset`} /></svg>重置
          </ResetButton>
          <LayerSwitcher
            layerCount={Math.min(Math.max(layerCount - (profile === 'windows' ? 4 : 0), 0), 4)}
            current={currentLayer}
            layerOffset={profile === 'windows' ? 4 : 0}
            onChange={setLayer}
          />
        </Toolbar>
      )}
    </Header>
  );
};
