import React, {useState} from 'react';
import styled from 'styled-components';
import {useNavigate} from 'react-router-dom';
import {useKeyboardStore} from '../store/keyboard';
import {useThemeStore} from '../store/theme';
import navSprite from '../assets/nuphy/icons/nav-symbols.svg?url';
import {messages} from '../i18n';

// ============================================================
// 原版 fixTop 顶栏(1:1)
// .fixTop (sticky, padding-bottom 0.75rem)
//   .leftBox
//   .right (flex, gap 0.5rem)
//     .coloursLoadingBac  — 连接状态/加载
//     .rightRightBox (bg white, radius 0.75rem, padding 0.125rem)
//       .mBoxBac.pointer  — M1 + 设备名
//       键盘图标           — 连接/断开
//       MoreBox 下拉       — VIA 使用说明
//       SettingGear        — 设置
// ============================================================

const FixTopBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0 0 0.75rem;
  position: sticky;
  top: 0;
  z-index: 30;
`;

const LeftBox = styled.div`
  display: flex;
  width: 0;
`;

const Right = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  margin-left: auto;
  align-items: center;
`;

const ColoursLoadingBac = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-black-s-content);
  font-size: 0.75rem; /* 原版 6.67px */
  white-space: nowrap;
  p {
    margin: 0;
  }
`;

const Spinner = styled.span`
  width: 0.875rem;
  height: 0.875rem;
  border: 0.125rem solid var(--black-12);
  border-top-color: var(--theme-color);
  border-radius: 50%;
  display: inline-block;
  animation: spin 1s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const StatusDot = styled.span<{$mode: string}>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  display: inline-block;
  background: ${(p) =>
    p.$mode === 'connected'
      ? 'var(--theme-color)'
      : p.$mode === 'demo'
        ? '#ff9500'
        : 'var(--black-32)'};
`;

const RightRightBox = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  background: var(--surface-card);
  border-radius: 0.75rem;
  padding: 0.125rem;
  box-shadow: 0 1px 6px var(--black-8);
`;

const MBoxBac = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  align-self: stretch;
  justify-content: center;
  gap: 0.375rem;
  background: var(--black-4);
  border-radius: 0.625rem;
  padding: 0 0.25rem;
  cursor: pointer;
  height: 1.5rem;
  transition: background 0.15s;
  &:hover {
    background: var(--black-8);
  }
`;

const MBox = styled.div`
  display: flex;
  width: 2rem;
  min-width: 2rem;
  height: 1.0625rem;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--white-100);
  background: var(--button-black-l);
  border-radius: 0.375rem;
  line-height: normal;
  p {
    margin: 0;
  }
`;

const LeftName = styled.p`
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const IconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  line-height: 0;
  border-radius: 0.625rem;
  color: var(--text-black-l-title);
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover {
    background: var(--black-4);
  }
  svg {
    display: block;
    width: 1.25rem;
    height: 1.25rem;
    fill: currentColor;
    stroke: none;
    overflow: visible;
  }
  .top-icon-MoreBox,
  .top-icon-SettingGear { fill: none; }
  svg.theme-icon {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

const MoreMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.375rem);
  right: 0;
  background: var(--surface-card);
  border-radius: 0.75rem;
  padding: 0.25rem;
  box-shadow: 0 4px 20px var(--black-16);
  min-width: 9rem;
  z-index: 50;
`;

const MoreItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-black-l-title);
  cursor: pointer;
  &:hover {
    background: var(--black-4);
  }
`;

const MoreWrap = styled.div`
  position: relative;
`;

const ProfileOverlay = styled.div`
  position: fixed;
  z-index: 50;
  inset: 3rem 0 0;
  overflow: auto;
  background-color: var(--background-canvas);
  background-image: var(--app-background-image);
  background-position: center bottom;
  background-size: cover;
`;

const ProfileShell = styled.div`
  width: 70.5rem;
  max-width: calc(100% - 3rem);
  min-height: 100%;
  margin: 0 auto;
`;

const ProfileTitle = styled.div`
  display: flex;
  height: 2.25rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  box-sizing: border-box;
  background: var(--background-canvas-overlay);
  border-radius: 1.5rem 1.5rem 0 0;
  color: var(--text-black-l-title);
  font-size: 0.75rem;
  font-weight: 700;
`;

const ProfileClose = styled.button`
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

const ProfileBody = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  box-sizing: border-box;
  background: var(--background-canvas-overlay);
  border-radius: 0 0 1.5rem 1.5rem;
`;

const ProfileCard = styled.section<{$recommended?: boolean}>`
  display: flex;
  min-height: ${(p) => (p.$recommended ? '4.1875rem' : '6.875rem')};
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  box-sizing: border-box;
  background: var(--surface-card);
  border-radius: 1rem;
`;

const ProfileCardHeader = styled.div`
  display: flex;
  min-height: 2.1875rem;
  align-items: center;
  gap: 1rem;
  color: var(--text-black-l-title);
  > div { display: flex; flex-direction: column; gap: 0.125rem; }
  .title { font-size: 0.75rem; font-weight: 700; }
  .description { color: var(--text-black-s-content); font-size: 0.75rem; font-weight: 500; }
`;

const ProfileRows = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
`;

const ProfileRow = styled.button<{$active: boolean}>`
  display: flex;
  height: 2.625rem;
  align-items: center;
  gap: 0.125rem;
  padding: 0.625rem;
  border: 0.09375rem dashed transparent;
  border-radius: 0.75rem;
  background: var(--black-4);
  color: var(--text-black-l-title);
  text-align: left;
  cursor: pointer;
  &:hover { border-color: var(--theme-color); }
  .badge {
    display: flex;
    flex: 0 0 auto;
    min-width: 2.125rem;
    height: 1rem;
    align-items: center;
    justify-content: center;
    padding: 0 0.5rem;
    border-radius: 0.375rem;
    background: var(--black-86);
    color: var(--white-100);
    font-size: 0.625rem;
    font-weight: 900;
    line-height: 1;
  }
  .name { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; font-weight: 700; }
  .handle { display: flex; flex: 0 0 auto; align-items: center; gap: 0.5rem; }
  .current {
    display: flex;
    align-items: center;
    padding: 0.125rem 0.375rem;
    border-radius: 0.375rem;
    background: var(--theme-color);
    color: var(--white-100);
    font-size: 0.625rem;
    font-weight: 700;
    line-height: 1;
  }
  svg { width: 1.25rem; height: 1.25rem; fill: currentColor; }
  svg.top-icon-MoreBox { fill: none; }
`;

const IOModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--backgroundColorMask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`;

const IOModalBox = styled.div`
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  width: min(26rem, calc(100vw - 3rem));
  box-shadow: 0 8px 40px var(--black-32);
`;

const IOModalTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-black-l-title);
  margin-bottom: 0.75rem;
`;

const IOModalText = styled.p`
  font-size: 0.75rem;
  color: var(--text-black-s-content);
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const ModalBtnRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ModalBtn = styled.button`
  padding: 0.375rem 1.25rem;
  border-radius: 0.625rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  background: var(--dark-mode-button);
  cursor: pointer;
`;

const SvgIcon: React.FC<{id: string}> = ({id}) => (
  <svg className={`top-icon top-icon-${id}`} viewBox="0 0 24 24" aria-hidden="true">
    <use href={`${navSprite}#${id}`} />
  </svg>
);

const SunIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75M5.106 5.106a.75.75 0 0 1 1.06 0l1.592 1.591a.75.75 0 1 1-1.061 1.06l-1.591-1.59a.75.75 0 0 1 0-1.061M18.894 5.106a.75.75 0 0 1 0 1.06l-1.591 1.591a.75.75 0 1 1-1.061-1.06l1.591-1.591a.75.75 0 0 1 1.061 0M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6m-3.182-.182a4.5 4.5 0 1 1 6.364 6.364 4.5 4.5 0 0 1-6.364-6.364M2.25 12a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75m16.5 0a.75.75 0 0 1 .75-.75H21a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1 0-.75M6.167 16.773a.75.75 0 0 1 1.06 0 .75.75 0 0 1 0 1.06l-1.59 1.592a.75.75 0 1 1-1.061-1.061zM17.833 16.773a.75.75 0 0 1 1.061 1.06l-1.591 1.592a.75.75 0 1 1-1.061-1.061zM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18" clipRule="evenodd" />
  </svg>
);

const MoonIcon: React.FC = () => (
  <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19.25 13.22a7.5 7.5 0 1 1-8.47-8.47 6.25 6.25 0 0 0 8.47 8.47Z" />
  </svg>
);

const modeText: Record<string, string> = {
  connected: '已连接',
  demo: '演示模式',
  disconnected: '未连接',
};

export const FixTop: React.FC = () => {
  const {mode, connecting, connect, disconnect, error, profile, setProfile} =
    useKeyboardStore();
  const {theme, toggleTheme} = useThemeStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ioModal, setIoModal] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const name = profile === 'windows' ? 'Windows' : 'Mac';
  const modeBadge = profile === 'windows' ? 'M2' : 'M1';

  return (
    <FixTopBar className="fixTop">
      <LeftBox className="leftBox" />
      <Right className="right">
        {/* NuPhy 的正常设备页不显示演示状态；仅在真实连接/错误时保留反馈。 */}
        {(connecting || error || mode !== 'demo') && (
          <ColoursLoadingBac className="coloursLoadingBac">
            {connecting ? (
              <>
                <Spinner />
                <p>连接中…</p>
              </>
            ) : error ? (
              <p title={error} style={{color: 'var(--other-warning)'}}>
                ⚠ {error.substring(0, 30)}
              </p>
            ) : (
              <>
                <StatusDot $mode={mode} />
                <p>{modeText[mode] ?? '未连接'}</p>
              </>
            )}
          </ColoursLoadingBac>
        )}

        <RightRightBox className="rightRightBox">
          <MBoxBac
            className="mBoxBac pointer"
            onClick={() => setProfileOpen(true)}
            title="我的配置"
            aria-expanded={profileOpen}
          >
            <MBox className="mBox">
              <p>{modeBadge}</p>
            </MBox>
            <LeftName className="leftName">{name}</LeftName>
          </MBoxBac>

          <IconBtn
            title={mode === 'connected' ? '断开' : '连接'}
            onClick={() => (mode === 'connected' ? disconnect() : connect())}
          >
            <SvgIcon id="keyboard" />
          </IconBtn>

          <MoreWrap>
            <IconBtn title="更多" onClick={() => setMenuOpen((v) => !v)}>
              <SvgIcon id="MoreBox" />
            </IconBtn>
            {menuOpen && (
              <MoreMenu onMouseLeave={() => setMenuOpen(false)}>
                <MoreItem onClick={() => { setMenuOpen(false); setIoModal(true); }}>
                  {messages.GlobalSettingsPage?.IOManual ?? 'VIA 使用说明'}
                </MoreItem>
              </MoreMenu>
            )}
          </MoreWrap>

          <IconBtn
            title={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
            aria-label={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </IconBtn>

          <IconBtn
            title={messages.GlobalSettingsPage?.Settings ?? '设置'}
            onClick={() => navigate('/setting')}
          >
            <SvgIcon id="SettingGear" />
          </IconBtn>
        </RightRightBox>
      </Right>

      {profileOpen && (
        <ProfileOverlay aria-label="我的配置">
          <ProfileShell>
            <ProfileTitle>
              <span>我的配置</span>
              <ProfileClose aria-label="关闭" title="关闭" onClick={() => setProfileOpen(false)}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M6 4.75A3.25 3.25 0 0 0 2.75 8v4A3.25 3.25 0 0 0 6 15.25h8A3.25 3.25 0 0 0 17.25 12V8A3.25 3.25 0 0 0 14 4.75zM1.25 8A4.75 4.75 0 0 1 6 3.25h8A4.75 4.75 0 0 1 18.75 8v4A4.75 4.75 0 0 1 14 16.75H6A4.75 4.75 0 0 1 1.25 12z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M8.762 7.702a.75.75 0 0 0-1.06 1.06L8.938 10 7.7 11.237a.75.75 0 1 0 1.061 1.061L10 11.061l1.237 1.237a.75.75 0 1 0 1.06-1.06L11.06 10l1.238-1.237a.75.75 0 0 0-1.061-1.061L10 8.939z" clipRule="evenodd" />
                </svg>
              </ProfileClose>
            </ProfileTitle>
            <ProfileBody>
              <ProfileCard>
                <ProfileCardHeader>
                  <div>
                    <span className="title">板载配置</span>
                    <span className="description">保存在键盘中的模式，支持将“推荐配置”拖放至此，替换其中某个模式。</span>
                  </div>
                </ProfileCardHeader>
                <ProfileRows>
                  <ProfileRow $active={profile === 'mac'} onClick={() => { setProfile('mac'); setProfileOpen(false); }}>
                    <span className="badge">M1</span>
                    <span className="name">Mac</span>
                    <span className="handle">
                      {profile === 'mac' && <span className="current">当前模式</span>}
                      <SvgIcon id="MoreBox" />
                    </span>
                  </ProfileRow>
                  <ProfileRow $active={profile === 'windows'} onClick={() => { setProfile('windows'); setProfileOpen(false); }}>
                    <span className="badge">M2</span>
                    <span className="name">Windows</span>
                    <span className="handle"><SvgIcon id="MoreBox" /></span>
                  </ProfileRow>
                </ProfileRows>
              </ProfileCard>
              <ProfileCard $recommended>
                <ProfileCardHeader>
                  <div>
                    <span className="title">推荐配置</span>
                    <span className="description">未保存到键盘中的模式，用于保存暂时不用的模式。</span>
                  </div>
                </ProfileCardHeader>
              </ProfileCard>
            </ProfileBody>
          </ProfileShell>
        </ProfileOverlay>
      )}

      {ioModal && (
        <IOModalOverlay onClick={() => setIoModal(false)}>
          <IOModalBox onClick={(e) => e.stopPropagation()}>
            <IOModalTitle>{messages.GlobalSettingsPage?.IOManual ?? 'VIA 使用说明'}</IOModalTitle>
            <IOModalText>
              {messages.GlobalSettingsPage?.AuthorizedTips1 ??
                '在浏览器弹出的授权弹窗中选中您的 NuPhy Halo 键盘并单击「连接」。'}
              <br />
              {messages.GlobalSettingsPage?.AuthorizedTips2 ??
                '若您不想更新固件或不小心关闭了网页,请拔掉键盘重新上电。'}
            </IOModalText>
            <ModalBtnRow>
              <ModalBtn onClick={() => setIoModal(false)}>知道了</ModalBtn>
            </ModalBtnRow>
          </IOModalBox>
        </IOModalOverlay>
      )}
    </FixTopBar>
  );
};
