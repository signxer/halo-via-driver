import React, {useState} from 'react';
import styled from 'styled-components';
import {useNavigate} from 'react-router-dom';
import {useKeyboardStore} from '../store/keyboard';
import {useThemeStore} from '../store/theme';
import {messages} from '../i18n';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0 0 2rem;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 70.5rem;
  margin: 0 auto;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .5rem 1rem 1rem;
  background: var(--surface-card);
  border-radius: 1rem 1rem 0 0;
  h3 {
    margin: 0;
    color: var(--text-black-l-title);
    font-size: .875rem;
    font-weight: 900;
  }
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 0;
  border-radius: .875rem;
  background: transparent;
  color: var(--text-black-l-title);
  cursor: pointer;
  &:hover { background: var(--black-4); }
  svg { width: 1.25rem; height: 1.25rem; fill: currentColor; }
`;

const SettingsGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: .5rem;
`;

const Group = styled.div`
  padding: .25rem .5rem;
  border-radius: 1rem;
  background: var(--surface-card);
  box-shadow: 0 .125rem .5rem var(--black-4);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  min-height: 3.75rem;
  gap: 1rem;
  padding: .5rem .25rem;
  &:not(:last-child) { border-bottom: 1px solid var(--black-4); }
  > div:first-child { flex: 1; min-width: 0; }
  h4 {
    margin: 0;
    color: var(--text-black-l-title);
    font-size: .6875rem;
    font-weight: 700;
  }
  p {
    margin: .125rem 0 0;
    color: var(--text-black-s-content);
    font-size: .5625rem;
    line-height: 1.35;
  }
`;

const Pill = styled.button`
  min-width: 4.75rem;
  height: 1.75rem;
  padding: 0 .625rem;
  border: 0;
  border-radius: .875rem;
  background: var(--black-4);
  color: var(--text-black-l-title);
  font-size: .625rem;
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: .45; cursor: not-allowed; }
`;

const ResetPill = styled(Pill)`
  background: var(--selection-error-fill);
  color: var(--selection-error-border);
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--backgroundColorMask);
`;

const ModalBox = styled.div`
  width: min(26rem, calc(100vw - 3rem));
  padding: 1.5rem;
  border-radius: 1rem;
  background: var(--surface-card);
  box-shadow: 0 8px 40px var(--black-32);
`;

const ModalTitle = styled.h3`
  margin: 0 0 .75rem;
  color: var(--text-black-l-title);
  font-size: .875rem;
  font-weight: 900;
`;

const ModalText = styled.p`
  margin: 0 0 1rem;
  color: var(--text-black-s-content);
  font-size: .75rem;
  line-height: 1.7;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
`;

const ModalButton = styled(Pill)<{$primary?: boolean}>`
  background: ${(p) => (p.$primary ? 'var(--dark-mode-button)' : 'var(--button-black-xs-min)')};
  color: ${(p) => (p.$primary ? '#fff' : 'var(--text-black-l-title)')};
`;

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.7 2.88 18.29 9.17 12 2.88 5.71 4.3 4.29 10.59 10.6 16.89 4.3z" />
  </svg>
);

export const SettingsPage: React.FC = () => {
  const {mode, api} = useKeyboardStore();
  const {theme, toggleTheme} = useThemeStore();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const resetKeyboard = async () => {
    if (!api) return;
    setBusy(true);
    try {
      await api.resetEEPROM();
      setConfirmReset(false);
    } catch (error: any) {
      alert(`操作失败: ${error?.message ?? error}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <Panel>
        <Title>
          <h3>{messages.GlobalSettingsPage?.Settings ?? '设置'}</h3>
          <CloseBtn onClick={() => navigate('/pressKey')} title="关闭">
            <CloseIcon />
          </CloseBtn>
        </Title>

        <SettingsGroups>
          <Group>
            <Row>
              <div>
                <h4>切换语言</h4>
                <p>切换 NuPhyIO 显示语言。</p>
              </div>
              <Pill disabled>简体中文⌄</Pill>
            </Row>
            <Row>
              <div>
                <h4>主题切换</h4>
                <p>切换 NuPhyIO 显示主题，支持亮色、暗色两种模式。</p>
              </div>
              <Pill onClick={toggleTheme}>{theme === 'dark' ? '暗色模式⌄' : '亮色模式⌄'}</Pill>
            </Row>
          </Group>

          <Group>
            <Row>
              <div>
                <h4>重置键盘</h4>
                <p>重置键盘将恢复键盘到出厂设置，并删除所有用户配置，请谨慎操作。</p>
              </div>
              <ResetPill
                disabled={mode !== 'connected' || busy}
                onClick={() => setConfirmReset(true)}
              >
                重置键盘
              </ResetPill>
            </Row>
          </Group>
        </SettingsGroups>
      </Panel>

      {confirmReset && (
        <Overlay onClick={() => !busy && setConfirmReset(false)}>
          <ModalBox onClick={(event) => event.stopPropagation()}>
            <ModalTitle>确认重置键盘？</ModalTitle>
            <ModalText>
              这会清除键盘上所有自定义键位和灯效设置，恢复出厂状态。此操作不可撤销。
            </ModalText>
            <ModalActions>
              <ModalButton disabled={busy} onClick={() => setConfirmReset(false)}>取消</ModalButton>
              <ModalButton $primary disabled={busy} onClick={resetKeyboard}>
                {busy ? '执行中…' : '确认执行'}
              </ModalButton>
            </ModalActions>
          </ModalBox>
        </Overlay>
      )}
    </Page>
  );
};
