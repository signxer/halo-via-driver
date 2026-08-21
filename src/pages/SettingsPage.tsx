import React, {useState} from 'react';
import styled from 'styled-components';
import {useNavigate} from 'react-router-dom';
import {useKeyboardStore} from '../store/keyboard';
import {messages} from '../i18n';

const Page = styled.div`
  position: fixed;
  z-index: 50;
  inset: 3rem 0 0;
  overflow: auto;
  background-color: var(--background-canvas);
  background-image: var(--app-background-image);
  background-position: center bottom;
  background-size: cover;
`;

const Panel = styled.div`
  width: 70.5rem;
  max-width: calc(100% - 3rem);
  min-height: 100%;
  margin: 0 auto;
`;

const Title = styled.div`
  display: flex;
  height: 2.25rem;
  align-items: center;
  justify-content: space-between;
  padding: .5rem 1rem;
  box-sizing: border-box;
  background: var(--background-canvas-overlay);
  border-radius: 1.5rem 1.5rem 0 0;
  h3 {
    margin: 0;
    color: var(--text-black-l-title);
    font-size: .75rem;
    font-weight: 700;
  }
`;

const CloseBtn = styled.button`
  display: flex;
  width: 1.25rem;
  height: 1.25rem;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-black-l-title);
  cursor: pointer;
  svg { width: 1.25rem; height: 1.25rem; fill: currentColor; }
`;

const SettingsGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: .5rem;
  width: 100%;
  min-height: calc(100% - 2.25rem);
  padding: .5rem;
  box-sizing: border-box;
  background: var(--background-canvas-overlay);
  border-radius: 0 0 1.5rem 1.5rem;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: .5rem;
  padding: .75rem .5rem;
  box-sizing: border-box;
  border-radius: 1rem;
  background: var(--surface-card);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  min-height: 2.625rem;
  gap: .5rem;
  padding: .625rem;
  box-sizing: border-box;
  border-radius: .75rem;
  background: var(--black-4);
  > div:first-child { flex: 1; min-width: 0; }
  h4 {
    margin: 0;
    color: var(--text-black-l-title);
    font-size: .75rem;
    font-weight: 700;
  }
  p {
    margin: .125rem 0 0;
    color: var(--text-black-s-content);
    font-size: .75rem;
    font-weight: 500;
    line-height: normal;
  }
`;

const Pill = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 4.75rem;
  height: 2rem;
  padding: 0 .75rem;
  border: 0;
  border-radius: .5rem;
  background: var(--button-black-l);
  color: var(--white-100);
  font-size: .75rem;
  font-weight: 700;
  cursor: pointer;
  &:hover:not(:disabled) { background: var(--dark-mode-button); }
  &:disabled {
    background: var(--black-4);
    color: var(--text-black-s-content);
    cursor: not-allowed;
  }
`;

const ResetPill = styled(Pill)`
  background: var(--selection-error-fill);
  color: var(--selection-error-border);
  &:hover:not(:disabled) {
    background: var(--selection-error-fill);
    filter: brightness(.96);
  }
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
  font-size: .75rem;
  font-weight: 700;
`;

const ModalText = styled.p`
  margin: 0 0 1rem;
  color: var(--text-black-s-content);
  font-size: .75rem;
  line-height: 1.6;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
`;

const ModalButton = styled(Pill)<{$primary?: boolean}>`
  background: ${(p) => (p.$primary ? 'var(--dark-mode-button)' : 'var(--button-black-xs-min)')};
  color: ${(p) => (p.$primary ? 'var(--white-100)' : 'var(--text-black-l-title)')};
`;

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M6 4.75A3.25 3.25 0 0 0 2.75 8v4A3.25 3.25 0 0 0 6 15.25h8A3.25 3.25 0 0 0 17.25 12V8A3.25 3.25 0 0 0 14 4.75zM1.25 8A4.75 4.75 0 0 1 6 3.25h8A4.75 4.75 0 0 1 18.75 8v4A4.75 4.75 0 0 1 14 16.75H6A4.75 4.75 0 0 1 1.25 12z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M8.762 7.702a.75.75 0 0 0-1.06 1.06L8.938 10 7.7 11.237a.75.75 0 1 0 1.061 1.061L10 11.061l1.237 1.237a.75.75 0 1 0 1.06-1.06L11.06 10l1.238-1.237a.75.75 0 0 0-1.061-1.061L10 8.939z" clipRule="evenodd" />
  </svg>
);

export const SettingsPage: React.FC = () => {
  const {mode, api} = useKeyboardStore();
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
