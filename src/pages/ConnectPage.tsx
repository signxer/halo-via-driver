import React, {useState} from 'react';
import styled, {css} from 'styled-components';
import {useNavigate} from 'react-router-dom';
import {useKeyboardStore} from '../store/keyboard';
import {useThemeStore} from '../store/theme';
import connectIcon from '../assets/nuphy/connect-icon.webp';
import kbLight from '../assets/nuphy/empty-kb1.webp';
import kbDark from '../assets/nuphy/empty-kb2.webp';
import navSprite from '../assets/nuphy/icons/nav-symbols.svg?url';
import {messages} from '../i18n';

// ============================================================
// 连接页 — 1:1 复刻原版 drive.nuphyio.com/#/auth
// .page(圆角底:bg #f9f9f9 + radius 1.5rem + padding 0.5rem)
//   .home-top-nav(简体中文/主题装扮)
//   连接图标(18×138,top -20)+ 键盘连接图(empty-kb,553×188,top -30)
//   提示文字 + 「授权连接」按钮 + 页脚
// ============================================================

const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  background: var(--background-canvas-overlay); /* 原版 #f9f9f9 */
  border-radius: 1.5rem; /* 圆角的底 */
  padding: 0.5rem;
  overflow: hidden;
  position: relative;
`;

const HomeTopNav = styled.div`
  display: flex;
  padding: 0 0.5rem;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  min-height: 1.5rem;
  flex-shrink: 0;
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-black-l-title);
`;

const NavRight = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-black-l-title);
  cursor: pointer;
  padding: 0.125rem 0.25rem;
  border-radius: 0.375rem;
  &:hover {
    background: var(--black-4);
  }
  svg {
    width: 0.875rem;
    height: 0.875rem;
    fill: currentColor;
  }
`;

// 连接图标(原版 18×138,视觉 y≈2)
const ConnectIcon = styled.img<{$paused: boolean}>`
  width: 2.025rem; /* 18px */
  height: 15.525rem; /* 138px */
  position: relative;
  margin-top: -2.25rem; /* flow 占用与原版一致,不影响下方键盘 */
  top: 0.5rem; /* 视觉偏移,对齐原版 y=2 */
  ${(p) =>
    !p.$paused &&
    css`
      animation: connectFloat 2.2s ease-in-out infinite;
    `}
  @keyframes connectFloat {
    0%, 100% { transform: translateY(-4%); }
    50% { transform: translateY(4%); }
  }
`;

// 键盘连接图(原版 empty-kb 553×188,top -30)
const KbEmpty = styled.img`
  width: 62.2125rem; /* 553px */
  height: 21.15rem; /* 188px */
  position: relative;
  top: -3.375rem; /* -30px */
  margin-top: 2.3625rem; /* 21px(与原版 flow 位置一致) */
  pointer-events: none;
  object-fit: fill;
`;

const ConnectP = styled.p`
  font-size: 0.75rem; /* 原版 6.67px */
  font-weight: 400;
  color: var(--text-black-s-content);
  margin: 3.4875rem 0 1rem; /* 顶部 31px */
  text-align: center;
`;

const BtnRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const ConnectBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 7.75rem;
  padding: 0.625rem 1.5rem;
  border-radius: 1.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #fff;
  background: var(--dark-mode-button);
  transition: all 0.2s ease;
  &:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const DemoBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 7.75rem;
  padding: 0.625rem 1.5rem;
  border-radius: 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-black-l-title);
  background: var(--button-black-xs-min);
  transition: all 0.2s ease;
  &:hover {
    background: var(--black-8);
  }
`;

const ErrorP = styled.p`
  font-size: 0.75rem;
  color: var(--other-warning);
  margin-top: 0.75rem;
  max-width: 80vw;
  text-align: center;
  white-space: pre-wrap;
`;

const FixBottom = styled.div`
  margin-top: auto;
  padding: 1rem 0 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  p {
    margin: 0;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
`;

const DemoHint = styled.p`
  font-size: 0.625rem;
  color: var(--text-black-s-content);
`;

const FooterText = styled.p`
  font-size: 0.625rem;
  color: var(--text-black-s-content);
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
`;

const SvgIcon: React.FC<{id: string}> = ({id}) => (
  <svg>
    <use href={`${navSprite}#${id}`} />
  </svg>
);

export const ConnectPage: React.FC = () => {
  const {mode, connecting, error, connect, initDemo} = useKeyboardStore();
  const {theme, toggleTheme} = useThemeStore();
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);
  const noHid = typeof navigator === 'undefined' || !('hid' in navigator);

  const kbImg = theme === 'dark' ? kbDark : kbLight;

  const handleConnect = async () => {
    setPaused(true);
    try {
      await connect();
    } catch {
      // 错误显示在页面上
    } finally {
      setTimeout(() => setPaused(false), 600);
    }
  };

  return (
    <Page>
      <HomeTopNav className="home-top-nav">
        <NavLeft>NuPhyIO</NavLeft>
        <NavRight>
          <NavItem onClick={toggleTheme} title="主题切换">
            <SvgIcon id="MoreBox" />
            {theme === 'dark' ? '暗色' : '亮色'}
          </NavItem>
          <NavItem onClick={() => navigate('/setting')} title="设置">
            <SvgIcon id="SettingGear" />
          </NavItem>
        </NavRight>
      </HomeTopNav>

      <ConnectIcon src={connectIcon} alt="connect" $paused={paused} />

      <KbEmpty src={kbImg} alt="empty" draggable={false} />

      <ConnectP>
        {messages.HomePage?.PleaseContent ?? '请接入键盘并点击下方的按钮授权网页连接设备'}
      </ConnectP>

      <BtnRow>
        <ConnectBtn
          onClick={handleConnect}
          disabled={connecting || mode === 'connected' || noHid}
        >
          {connecting ? '连接中…' : (messages.HomePage?.ClickContent ?? '授权连接')}
        </ConnectBtn>
        <DemoBtn onClick={() => initDemo()}>进入演示模式(无需键盘)</DemoBtn>
      </BtnRow>

      {noHid && (
        <ErrorP>
          当前浏览器不支持 WebHID。请使用 Chrome、Edge 等 Chromium 内核浏览器打开。
        </ErrorP>
      )}
      {error && !noHid && <ErrorP>⚠️ {error}</ErrorP>}

      <FixBottom>
        <FooterText>
          <span>© 2024 NuPhy® 适用于 Mac 和 Windows 的键盘</span>
          <a href="http://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
            粤ICP备2023136929号
          </a>
        </FooterText>
        <DemoHint>演示模式:不连接键盘,模拟浏览所有页面并试改键位(仅保存在内存)。</DemoHint>
      </FixBottom>
    </Page>
  );
};
