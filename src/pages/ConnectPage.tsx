import React, {useState} from 'react';
import styled from 'styled-components';
import {useKeyboardStore} from '../store/keyboard';
import {useThemeStore} from '../store/theme';
import connectIcon from '../assets/nuphy/connect-icon.webp';
import kbLight from '../assets/nuphy/empty-kb1.webp';
import kbDark from '../assets/nuphy/empty-kb2.webp';
import {messages} from '../i18n';

// 连接页沿用 drive.nuphyio.com/#/auth 的页面层级与 rem 尺寸。
const Page = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  flex: 1;
  background: var(--background-canvas-overlay);
  padding: 0.5rem;
  border-radius: 1.5rem;
  overflow: hidden;
`;

const HomeTopNav = styled.div`
  display: flex;
  width: 100%;
  padding: 0 0.5rem;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  background: transparent;
  flex-shrink: 0;
`;

const Logo = styled.svg`
  width: 3.5rem;
  height: 1rem;
  min-width: 3.5rem;
  color: var(--text-black-l-title);
  fill: currentColor;
`;

const NavRight = styled.div`
  display: flex;

  & > * + * {
    margin-left: 0.5rem;
  }
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  color: var(--text-black-l-title);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: normal;
  padding: 0;
  white-space: nowrap;

  .nav-button-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    margin-right: 0.25rem;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: currentColor;
    stroke: currentColor;
  }
`;

const ConnectIcon = styled.img<{$paused: boolean}>`
  width: 2.0625rem;
  position: relative;
  z-index: 0;
  top: -2.25rem;
  animation-name: translatey;
  animation-duration: 5s;
  animation-iteration-count: infinite;
  animation-play-state: ${(props) => (props.$paused ? 'paused' : 'running')};

  @keyframes translatey {
    0% { transform: translateY(-50%); }
    50% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
`;

const KbEmpty = styled.img`
  height: 21.125rem;
  position: relative;
  top: -3.375rem;
  pointer-events: none;
`;

const ConnectP = styled.p`
  margin: 0.25rem 0 1rem;
  color: var(--text-black-s-content);
  font-size: 0.75rem;
  font-weight: 400;
  line-height: normal;
  text-align: center;
`;

const ConnectBtn = styled.button`
  width: 100%;
  max-height: 100%;
  height: 1.5625rem;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 0 0.75rem;
  border-radius: 0.5rem;
  background: var(--button-black-l);
  color: var(--text-white-l-title);
  font-size: 0.75rem;
  font-weight: 700;

  p {
    margin: 0;
    white-space: nowrap;
    line-height: 1em;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConnectBtnWrap = styled.div`
  width: fit-content;
  height: 1.5625rem;
`;

const ErrorP = styled.p`
  max-width: 80vw;
  margin-top: 0.75rem;
  color: var(--other-warning);
  font-size: 0.75rem;
  text-align: center;
  white-space: pre-wrap;
`;

const FixBottom = styled.div`
  position: fixed;
  width: 100%;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 2.5rem 0.75rem;
  color: var(--text-black-s-content);
  font-size: 0.75rem;
  text-align: center;
`;

const FooterText = styled.span`
  white-space: nowrap;
`;

const NuphyLogo: React.FC = () => (
  <Logo viewBox="0 0 56 16" aria-label="NuPhyIO">
    <path d="M4.357 3.01 6.34 7.832l.02.032.022.042.02.063.033.064s.02.042.02.063l.022.063.02.064s.022.042.022.063l.021.063.021.064s.021.042.021.063l.021.063c.021.063.053.137.074.2l.021.053c.074.222.137.433.169.623v.02-.274c0-.158.01-.337.032-.527v-.232l.02-.095v-.074l.022-.105v-.085l.021-.084v-.084l.021-.064.749-4.8h2.51l-1.487 9.758H5.992L3.882 7.8l-.032-.074-.02-.053-.033-.074-.031-.074-.032-.073-.031-.064-.022-.063-.02-.042-.022-.063-.02-.043-.022-.063v-.042l-.021-.042v-.043l-.021-.042-.021-.052V6.87a9 9 0 0 1-.19-.654v-.052l-.01.316c0 .169 0 .338-.022.528v.116l-.02.073v.138l-.022.105v.106l-.021.116v.116l-.01.02-.718 4.937H0l1.487-9.715h2.87zM13.129 6.124l-.422 2.785-.021.18-.021.168v.105l-.032.127-.021.137v.095l-.032.137v.063l-.02.085v.306c0 .327.073.57.22.738q.22.253.644.253.98 0 1.33-2.278V8.94l.02-.073v-.084l.412-2.659h2.289l-.464 3.049-.021.137v.042c-.232 1.424-.591 2.373-1.066 2.848a3.1 3.1 0 0 1-1.118.686c-.443.158-.939.232-1.487.232-.96 0-1.71-.222-2.258-.675s-.822-1.055-.822-1.825v-.633l.01-.042V9.89l.021-.053v-.074l.021-.095.021-.105.022-.116.02-.116.022-.169.02-.158.032-.169.021-.106.401-2.584h2.279zM21.556 3.06h.7280000000000002l.065.004h.066l.065.008h.061l.041.008h.041l.037.004h.037l.057.008h.053l.037.008h.033l.033.009h.032l.033.008h.033s.012.004.016.008h.029l.028.008h.03l.011.008q.52.086.913.287l.02.012q.712.374 1.068 1.019.356.647.356 1.55 0 .895-.38 1.66-.381.768-1.032 1.179-.38.24-.904.344h-.024l-.037.012h-.025l-.028.008h-.029l-.029.008h-.028l-.029.008h-.045l-.032.009h-.033l-.033.008h-.033l-.032.008h-.037l-.053.008h-.037l-.037.004h-.037l-.037.004h-.04l-.062.004h-.061l-.062.004h-1.779l-.524 3.335h-2.483l1.485-9.573h2.594zm.045 2.037h-.47l-.34 2.172h.8180000000000003l.04-.004h.062l.037-.008h.037l.037-.009h.036l.017-.004h.037l.053-.012h.032l.033-.008h.017l.032-.008.05-.008h.044s.009-.009.017-.009l.028-.008c.029-.008.058-.012.086-.02l.029-.008h.012l.025-.009h.012l.024-.008.025-.008h.012l.025-.008a1 1 0 0 0 .2-.094c.287-.176.426-.47.426-.888q0-.528-.368-.773-.363-.24-1.13-.246zM29.298 2.47l-.573 3.559-.008.065q-.037.228-.078.45-.05.25-.11.495.528-.656 1.05-.949a2.3 2.3 0 0 1 1.142-.294q1.001 0 1.555.552.552.552.552 1.546v.192l-.004.029v.029l-.004.028v.029l-.008.045v.049l-.009.05v.032l-.008.053-.008.057-.008.058-.008.077v.041l-.017.086-.016.11-.008.046-.013.085s0 .02-.004.029v.025l-.004.032v.029l-.008.024v.009l-.536 3.465h-2.278l.535-3.498.009-.041q.019-.128.032-.25v-.036l.009-.037q.007-.098.008-.176 0-.431-.225-.655-.221-.22-.659-.22-.594.001-.928.437-.33.43-.48 1.375v.024l-.461 3.08H25.48L27.064 2.47zM35.894 6.002l.56 2.851.016.078.02.094.013.057v.029h.004l.012.057.013.053v.029h.004l.008.053.008.053s.004.037.008.054l.008.053c.033.204.05.384.054.548q.068-.257.18-.544.105-.277.253-.597l.017-.033 1.333-2.827h2.442l-4.998 9.52h-2.381l1.894-3.249-1.829-6.27h2.352zM40.847 12.677l1.515-9.573h2.607l-1.514 9.573zM50.427 12.91a6 6 0 0 1-1.866-.281 4.3 4.3 0 0 1-1.495-.844 4.1 4.1 0 0 1-1.074-1.482 4.7 4.7 0 0 1-.383-1.88c0-.715.108-1.38.332-2.006.223-.626.55-1.182.984-1.687a5.1 5.1 0 0 1 1.866-1.38 5.9 5.9 0 0 1 2.39-.48q2.157.002 3.49 1.24C55.559 4.934 56 6.014 56 7.337q-.002 1.066-.339 2.007a5.2 5.2 0 0 1-.984 1.687 5.3 5.3 0 0 1-1.872 1.4 5.8 5.8 0 0 1-2.378.48m.588-7.7c-.78 0-1.431.28-1.962.843q-.794.843-.792 2.09 0 1.101.632 1.763c.422.441.985.659 1.681.659q1.15-.002 1.956-.876.805-.871.805-2.128 0-1.034-.652-1.694c-.434-.44-.99-.664-1.668-.664z" />
  </Logo>
);

const MultilingualIcon: React.FC = () => (
  <svg viewBox="0 0 21 20" aria-hidden="true" fill="none">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.744 15.5V7.25a2.75 2.75 0 1 1 5.5 0v8.25M3.744 10.786h5.5M14.495 15.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5M17.245 10v5.5" />
  </svg>
);

const ThemeIcon: React.FC = () => (
  <svg viewBox="0 0 25 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12.18 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75M5.285 5.106a.75.75 0 0 1 1.061 0l1.591 1.59a.75.75 0 0 1-1.06 1.061l-1.592-1.59a.75.75 0 0 1 0-1.061m13.789 0a.75.75 0 0 1 0 1.06l-1.591 1.591a.75.75 0 1 1-1.06-1.06l1.59-1.591a.75.75 0 0 1 1.061 0M12.18 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6m-3.182-.182a4.5 4.5 0 1 1 6.364 6.364 4.5 4.5 0 0 1-6.364-6.364M2.43 12a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H3.18a.75.75 0 0 1-.75-.75m15.75 0a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75M7.937 16.243a.75.75 0 0 1 0 1.06l-1.591 1.591a.75.75 0 1 1-1.06-1.06l1.59-1.591a.75.75 0 0 1 1.061 0m8.485 0a.75.75 0 0 1 1.061 0l1.591 1.59a.75.75 0 1 1-1.06 1.061l-1.592-1.59a.75.75 0 0 1 0-1.061M12.18 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25a.75.75 0 0 1 .75-.75" clipRule="evenodd" />
  </svg>
);

export const ConnectPage: React.FC = () => {
  const {mode, connecting, error, connect} = useKeyboardStore();
  const {theme, toggleTheme} = useThemeStore();
  const [paused, setPaused] = useState(false);
  const noHid = typeof navigator === 'undefined' || !('hid' in navigator);
  const kbImg = theme === 'dark' ? kbDark : kbLight;

  const handleConnect = async () => {
    setPaused(true);
    try {
      await connect();
    } catch {
      // 错误显示在页面上。
    } finally {
      setTimeout(() => setPaused(false), 600);
    }
  };

  return (
    <Page>
      <HomeTopNav className="home-top-nav">
        <NuphyLogo />
        <NavRight className="rightBox">
          <NavItem type="button" title="切换语言">
            <span className="nav-button-icon"><MultilingualIcon /></span>
            <span className="nav-button-name">简体中文</span>
          </NavItem>
          <NavItem type="button" onClick={toggleTheme} title="主题装扮">
            <span className="nav-button-icon"><ThemeIcon /></span>
            <span className="nav-button-name">主题装扮</span>
          </NavItem>
        </NavRight>
      </HomeTopNav>

      <ConnectIcon src={connectIcon} alt="connect" $paused={paused} />
      <KbEmpty src={kbImg} alt="empty" draggable={false} />

      <ConnectP>
        {messages.HomePage?.PleaseContent ?? '请接入键盘并点击下方的按钮授权网页连接设备'}
      </ConnectP>

      <ConnectBtnWrap>
        <ConnectBtn
          onClick={handleConnect}
          disabled={connecting || mode === 'connected' || noHid}
        >
          <p>{connecting ? '连接中…' : (messages.HomePage?.ClickContent ?? '授权连接')}</p>
        </ConnectBtn>
      </ConnectBtnWrap>

      {noHid && (
        <ErrorP>当前浏览器不支持 WebHID。请使用 Chrome、Edge 等 Chromium 内核浏览器打开。</ErrorP>
      )}
      {error && !noHid && <ErrorP>⚠️ {error}</ErrorP>}

      <FixBottom>
        <FooterText>
          原版 NuPhyIO 风格，底层基于 VIA 协议实现。NuPhy、NuPhyIO 及相关商标归 NuPhy 所有，本项目仅用于兼容性和界面复刻。
        </FooterText>
      </FixBottom>
    </Page>
  );
};
