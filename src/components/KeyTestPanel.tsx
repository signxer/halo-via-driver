import React, {useEffect, useState} from 'react';
import styled from 'styled-components';

// 原版右侧 IO 工具面板：boxShadow > tool-item-content。
const Panel = styled.aside`
  position: fixed;
  z-index: 20;
  top: 3.04rem;
  right: 0.5rem;
  width: 13.5rem;
  height: 30.625rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--background-canvas-overlay);
  border-radius: 1.5rem;
  box-shadow: 0 0.3125rem 0.625rem rgba(0, 0, 0, 0.1);
  color: var(--text-black-l-title);
`;

const Header = styled.div`
  display: flex;
  flex: 0 0 auto;
  width: 100%;
  height: 2.1875rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const Logo = styled.div`
  display: flex;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  padding-left: 0.0625rem;
  border-radius: 50%;
  background: var(--black-4);
  color: var(--text-black-l-title);
  svg { display: block; width: 0.75rem; height: 0.5rem; fill: currentColor; }
`;

const HeaderDescription = styled.div`
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  overflow: hidden;
  span {
    display: block;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    line-height: normal;
  }
  .title { color: var(--text-black-l-title); font-weight: 700; }
  .description { color: var(--text-black-s-content); font-weight: 500; }
`;

const Close = styled.button`
  display: flex;
  flex: 0 0 auto;
  width: 1.25rem;
  height: 1.25rem;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-black-l-title);
  cursor: pointer;
  svg { display: block; width: 1.25rem; height: 1.25rem; fill: currentColor; }
`;

const Content = styled.div`
  display: flex;
  flex: 1 1 0;
  width: 100%;
  min-height: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
`;

const ControlBox = styled.div`
  display: flex;
  flex: 0 0 auto;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  box-sizing: border-box;
  background: var(--surface-card);
  border-radius: 1rem;
`;

const ControlRow = styled.div`
  display: flex;
  flex: 0 0 auto;
  width: 100%;
  height: 2.1875rem;
  align-items: center;
  justify-content: center;
`;

const Explain = styled.div`
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  overflow: hidden;
  span {
    display: block;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: normal;
  }
  .title { color: var(--text-black-l-title); font-size: 0.75rem; font-weight: 700; }
  .description { color: var(--text-black-s-content); font-size: 0.75rem; font-weight: 500; }
`;

const Handle = styled.div`
  display: flex;
  flex: 0 1 auto;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

const Clear = styled.button`
  display: flex;
  flex: 0 1 auto;
  height: 1.5625rem;
  align-items: center;
  justify-content: center;
  padding: 0 0.75rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--black-86);
  color: var(--white-100);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
`;

const Switch = styled.button<{$on: boolean}>`
  position: relative;
  display: block;
  width: 3.125rem;
  height: 1.875rem;
  padding: 0;
  border: 0;
  border-radius: 5rem;
  background: ${(p) => (p.$on ? 'var(--other-switch-on)' : 'var(--other-switch-off)')};
  cursor: pointer;
  &::after {
    content: '';
    position: absolute;
    top: 0.125rem;
    left: 0.125rem;
    width: 1.625rem;
    height: 1.625rem;
    border-radius: 50%;
    background: var(--other-switch-circle);
    transform: ${(p) => (p.$on ? 'translateX(1.25rem)' : 'translateX(0)')};
    transition: transform 0.15s ease;
  }
`;

const History = styled.div`
  display: flex;
  flex: 1 1 0;
  width: 100%;
  min-height: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.5rem;
  box-sizing: border-box;
  background: var(--surface-card);
  border-radius: 0.75rem;
`;

const HistoryTitle = styled.span`
  display: block;
  flex: 0 0 auto;
  width: 100%;
  overflow: hidden;
  color: var(--text-black-l-title);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const HistoryList = styled.div`
  display: flex;
  flex: 1 1 0;
  width: 100%;
  min-height: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.5rem;
  box-sizing: border-box;
  overflow: auto;
  background: var(--black-2);
  border-radius: 0.75rem;
  color: var(--text-black-l-title);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: normal;
`;

export const KeyTestPanel: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      setEvents((value) => [...value.slice(-19), event.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);

  if (!visible) return null;

  return (
    <Panel aria-label="按键测试">
      <Header>
        <Logo aria-hidden="true">
          <svg viewBox="0 0 13 8">
            <path d="M.895 7.79 2.095.21h2.064l-1.2 7.582zM8.481 7.976a4.7 4.7 0 0 1-1.478-.223 3.4 3.4 0 0 1-1.184-.668 3.3 3.3 0 0 1-.85-1.174 3.7 3.7 0 0 1-.304-1.488c0-.567.086-1.094.263-1.59s.436-.936.78-1.336Q6.314.784 7.186.404a4.7 4.7 0 0 1 1.893-.38c1.138 0 2.06.33 2.763.982.703.653 1.053 1.509 1.053 2.556q-.001.844-.269 1.59a4.1 4.1 0 0 1-.779 1.336c-.42.485-.911.855-1.483 1.108q-.858.38-1.883.38m.466-6.1q-.925 0-1.554.669-.628.668-.627 1.655 0 .873.5 1.397.503.522 1.332.521.91-.002 1.548-.693.639-.69.638-1.686 0-.819-.516-1.34-.517-.526-1.321-.527z" />
          </svg>
        </Logo>
        <HeaderDescription>
          <span className="title">按键测试</span>
          <span className="description">测试键盘按键功能</span>
        </HeaderDescription>
        <Close aria-label="关闭" title="关闭" onClick={() => setVisible(false)}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M6 4.75A3.25 3.25 0 0 0 2.75 8v4A3.25 3.25 0 0 0 6 15.25h8A3.25 3.25 0 0 0 17.25 12V8A3.25 3.25 0 0 0 14 4.75zM1.25 8A4.75 4.75 0 0 1 6 3.25h8A4.75 4.75 0 0 1 18.75 8v4A4.75 4.75 0 0 1 14 16.75H6A4.75 4.75 0 0 1 1.25 12z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M8.762 7.702a.75.75 0 0 0-1.06 1.06L8.938 10 7.7 11.237a.75.75 0 1 0 1.061 1.061L10 11.061l1.237 1.237a.75.75 0 1 0 1.06-1.06L11.06 10l1.238-1.237a.75.75 0 0 0-1.061-1.061L10 8.939z" clipRule="evenodd" />
          </svg>
        </Close>
      </Header>

      <Content>
        <ControlBox>
          <ControlRow>
            <Explain>
              <span className="title">清空记录</span>
              <span className="description">一键清空所有测试历史</span>
            </Explain>
            <Handle><Clear onClick={() => setEvents([])}>清空</Clear></Handle>
          </ControlRow>
          <ControlRow>
            <Explain>
              <span className="title">开启测试</span>
              <span className="description">打开开关启用本工具</span>
            </Explain>
            <Handle>
              <Switch aria-label="开启测试" role="switch" aria-checked={enabled} $on={enabled} onClick={() => setEnabled((value) => !value)} />
            </Handle>
          </ControlRow>
        </ControlBox>
        <History>
          <HistoryTitle>测试历史</HistoryTitle>
          <HistoryList aria-label="测试历史记录">
            {events.map((event, index) => <span key={`${event}-${index}`}>{event}</span>)}
          </HistoryList>
        </History>
      </Content>
    </Panel>
  );
};
