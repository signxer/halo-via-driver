import React, {useState} from 'react';
import styled from 'styled-components';
import {useNavigate} from 'react-router-dom';
import {useKeyboardStore} from '../store/keyboard';
import {useThemeStore} from '../store/theme';
import {messages} from '../i18n';
const socialSprite = '/social-symbols.svg';

// ============================================================
// 设置页 — 复刻原版 GlobalSettingsPage 结构
// .title(设置+关闭) + .content
//   groupCardBac(通用:主题切换 / IO手册 / 授权设备)
//   groupCardBac(设备:型号 / EEPROM重置 / Bootloader)
//   groupCardBac(关于)
// ============================================================

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
  align-self: stretch;
  padding: 0.5rem 1rem 1rem;
  background: var(--surface-card);
  border-radius: 1rem 1rem 0 0;
  h3 {
    font-size: 0.875rem; /* 原版 7.78px fw900 */
    font-weight: 900;
    color: var(--text-black-l-title);
    margin: 0;
  }
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.875rem;
  color: var(--text-black-l-title);
  cursor: pointer;
  &:hover {
    background: var(--black-4);
  }
  svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: currentColor;
  }
`;

const GroupCard = styled.div`
  display: flex;
  padding: 0.5rem;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 0;
  align-self: stretch;
  border-radius: 0.75rem;
  background: var(--surface-card);
  margin-bottom: 0.5rem;
  box-shadow: 0 0.125rem 0.5rem var(--black-4);
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  align-self: stretch;
  padding: 0.75rem;
  border-radius: 0.75rem;
  min-height: 3.5rem;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: var(--black-4);
  }
`;

const ItemIcon = styled.div`
  display: none;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.625rem;
  background: var(--surface-card);
  color: var(--text-black-l-title);
  flex-shrink: 0;
  svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: currentColor;
  }
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemTitle = styled.p`
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-black-l-title);
  margin: 0;
`;

const ItemDesc = styled.p`
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--text-black-s-content);
  margin: 0.125rem 0 0;
  line-height: 1.4;
`;

const ItemRight = styled.div`
  flex-shrink: 0;
`;

const ReferenceSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: .5rem;
  > div:nth-child(3) > div { min-height: 4.25rem; }
`;

const ReferenceGroup = styled.div`
  background: var(--surface-card);
  border-radius: 1rem;
  padding: .25rem .5rem;
  box-shadow: 0 .125rem .5rem var(--black-4);
`;

const ReferenceRow = styled.div`
  display:flex; align-items:center; min-height:3.75rem; gap:1rem;
  padding:.5rem .25rem;
  &:not(:last-child) { border-bottom:1px solid var(--black-4); }
  > div:first-child { flex:1; min-width:0; }
  h4 { margin:0; font-size:.6875rem; font-weight:700; color:var(--text-black-l-title); }
  p { margin:.125rem 0 0; font-size:.5625rem; line-height:1.35; color:var(--text-black-s-content); }
`;

const ReferencePill = styled.button`
  min-width:4.75rem; height:1.75rem; padding:0 .625rem;
  border:0; border-radius:.875rem; background:var(--black-4);
  color:var(--text-black-l-title); font-size:.625rem; font-weight:600;
`;

const ReferenceNumber = styled.input`
  width:3.5rem; height:1.75rem; border:0; outline:0; text-align:center;
  border-radius:.875rem 0 0 .875rem; background:var(--black-4);
  color:var(--text-black-l-title); font-size:.625rem;
`;

const Unit = styled.span`
  display:inline-flex; align-items:center; height:1.75rem; padding:0 .5rem 0 .25rem;
  margin-left:-.625rem; border-radius:0 .875rem .875rem 0;
  background:var(--black-4); color:var(--text-black-s-content); font-size:.625rem;
`;

const ReferenceSwitch = styled.button<{$on:boolean}>`
  width:2.5rem; height:1.5rem; border-radius:.75rem; padding:.125rem;
  background:${p=>p.$on?'#34c759':'#787880'};
  &::after { content:''; display:block; width:1.25rem; height:1.25rem; border-radius:50%; background:#fff; transform:${p=>p.$on?'translateX(1rem)':'translateX(0)'}; }
`;

const ReferenceFooter = styled.div`
  display:grid; grid-template-columns:1fr 1fr; gap:.5rem; margin:0 0 0 .5rem;
`;

const FeedbackBox = styled.div`
  min-height:12.25rem; padding:.75rem; border-radius:1rem; background:var(--surface-card);
  box-shadow:0 .125rem .5rem var(--black-4);
  display:grid; grid-template-columns:repeat(4,1fr); gap:.25rem;
  a, span { display:flex; align-items:center; justify-content:center; min-height:2.25rem; border-radius:.5rem; background:var(--black-2); color:var(--text-black-l-title); font-size:.6875rem; font-weight:700; text-decoration:none; }
  .feedback { grid-column:1/-1; display:block; background:none; min-height:0; font-size:.625rem; font-weight:500; }
  .social-icon svg { width:1.25rem; height:1.25rem; fill:currentColor; }
`;

const DownloadBox = styled.div`
  min-height:12.25rem; padding:.5rem; border-radius:1rem; background:var(--surface-card);
  box-shadow:0 .125rem .5rem var(--black-4); display:flex; flex-direction:column; gap:.5rem;
`;

const DownloadRow = styled.div`
  flex:1; display:flex; align-items:center; gap:.625rem; padding:.125rem 0 .125rem 1.5rem; border-radius:.625rem;
  .window { position:relative; width:10rem; height:4.75rem; flex:none; padding:.5rem .625rem; border-radius:.5rem; background:linear-gradient(135deg,#dce8f3 0%,#90acc8 100%); color:#314455; overflow:hidden; }
  .window b { display:block; font-size:.625rem; font-weight:800; }
  .window small { display:block; margin-top:1.25rem; font-size:.5rem; font-weight:700; }
  .window i { position:absolute; right:.5rem; bottom:.5rem; font-style:normal; font-size:1rem; }
  .mac { background:linear-gradient(135deg,#efb5dc 0%,#ad38a8 100%); color:#fff; }
  .mac::before { content:'●  ●  ●'; display:block; font-size:.5rem; letter-spacing:.125rem; }
  strong { display:block; font-size:.6875rem; }
  small { display:block; margin-top:.125rem; color:var(--text-black-s-content); font-size:.5625rem; }
  button { margin-left:auto; padding:.375rem .5rem; border-radius:.375rem; background:var(--black-86); color:#fff; font-size:.5625rem; font-weight:700; }
`;

// ---- 开关(原版 switch 样式) ----
const Switch = styled.button<{$on: boolean}>`
  width: 2.5rem;
  height: 1.5rem;
  border-radius: 0.75rem;
  background: ${(p) => (p.$on ? 'var(--other-switch-on)' : 'var(--other-switch-off)')};
  border: 1px solid var(--other-switch-border);
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    ${(p) => (p.$on ? 'right: 2px' : 'left: 2px')};
    width: 1.0625rem;
    height: 1.0625rem;
    border-radius: 50%;
    background: var(--other-switch-circle);
    transition: all 0.2s;
  }
`;

// ---- 小按钮(原版 0.6875rem 字号) ----
const MiniBtn = styled.button<{$primary?: boolean}>`
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 700;
  color: ${(p) => (p.$primary ? '#fff' : 'var(--text-black-l-title)')};
  background: ${(p) => (p.$primary ? 'var(--dark-mode-button)' : 'var(--button-black-xs-min)')};
  cursor: pointer;
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const DangerBtn = styled(MiniBtn)`
  background: var(--selection-error-fill);
  color: var(--selection-error-border);
`;

// ---- IO 手册弹窗 ----
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--backgroundColorMask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`;

const ModalBox = styled.div`
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  width: min(26rem, calc(100vw - 3rem));
  box-shadow: 0 8px 40px var(--black-32);
`;

const ModalTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 900;
  color: var(--text-black-l-title);
  margin-bottom: 0.75rem;
`;

const ModalText = styled.p`
  font-size: 0.75rem;
  color: var(--text-black-s-content);
  line-height: 1.7;
  margin-bottom: 1rem;
`;

const ModalBtnRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const DeviceBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  align-self: stretch;
  padding: 0.5rem;
`;

const DeviceImg = styled.img`
  width: 4.5rem;
  height: auto;
  border-radius: 0.375rem;
  background: var(--surface-card);
`;

const DeviceInfo = styled.div`
  flex: 1;
  min-width: 0;
  p {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const DeviceName = styled.p`
  font-size: 0.875rem; /* 原版设备名 7.78px fw900 */
  font-weight: 900;
  color: var(--text-black-l-title);
  margin: 0;
`;

const CloseIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.7 2.88 18.29 9.17 12 2.88 5.71 4.3 4.29 10.59 10.6 16.89 4.3z" />
  </svg>
);

const GearIcon = () => (
  <svg viewBox="0 0 21 20">
    <use href="/img/icons/settings-gear.svg#icon" />
  </svg>
);

const BookIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 4h5v8l-2.5-1.5L6 12z" />
  </svg>
);

const UsbIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M15 7v4h1v2h-3V5h2l-3-4-3 4h2v8H8v-2.07c.7-.37 1.2-1.08 1.2-1.93 0-1.21-.99-2.2-2.2-2.2S4.8 8.79 4.8 10c0 .85.5 1.56 1.2 1.93V13a2 2 0 0 0 2 2h3v2.07c-.7.37-1.2 1.08-1.2 1.93 0 1.21.99 2.2 2.2 2.2s2.2-.99 2.2-2.2c0-.85-.5-1.56-1.2-1.93V13h3a2 2 0 0 0 2-2v-1h1V7z" />
  </svg>
);

export const SettingsPage: React.FC = () => {
  const {mode, api, protocolVersion, layerCount, definition, model, deviceName, connect} =
    useKeyboardStore();
  const {theme, toggleTheme} = useThemeStore();
  const navigate = useNavigate();
  const [ioModal, setIoModal] = useState(false);
  const [confirm, setConfirm] = useState<'reset' | 'bootloader' | null>(null);
  const [busy, setBusy] = useState(false);
  const [sleepEnabled, setSleepEnabled] = useState(true);
  const [sleepOne, setSleepOne] = useState(6);
  const [sleepTwo, setSleepTwo] = useState(24);

  const name = deviceName ?? model.name;
  const matrix = definition?.matrix;

  const runAction = async (type: 'reset' | 'bootloader') => {
    if (!api) return;
    setBusy(true);
    try {
      if (type === 'reset') {
        await api.resetEEPROM();
      } else {
        await api.jumpToBootloader();
      }
      setConfirm(null);
    } catch (e: any) {
      console.error(type, e);
      alert(`操作失败: ${e?.message ?? e}`);
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

        <ReferenceSettings>
          <ReferenceGroup>
            <ReferenceRow>
              <div><h4>自动休眠</h4><p>键盘处于未工作状态后自动关闭灯光进入休眠状态。</p></div>
              <ReferenceSwitch $on={sleepEnabled} onClick={() => setSleepEnabled(v => !v)} aria-label="自动休眠" />
            </ReferenceRow>
            <ReferenceRow>
              <div><h4>一级休眠</h4><p>支持调节键盘进入一级休眠的时间，一级休眠状态下键盘会关闭灯光以增加使用时长。</p></div>
              <span><ReferenceNumber type="number" value={sleepOne} onChange={e=>setSleepOne(Number(e.target.value))}/><Unit>分钟</Unit></span>
            </ReferenceRow>
            <ReferenceRow>
              <div><h4>二级休眠</h4><p>支持调节键盘进入二级休眠的时间（需要先进入一级休眠），二级休眠状态下键盘会关闭灯光和通讯以增加使用时长。</p></div>
              <span><ReferenceNumber type="number" value={sleepTwo} onChange={e=>setSleepTwo(Number(e.target.value))}/><Unit>分钟</Unit></span>
            </ReferenceRow>
            <ReferenceRow>
              <div><h4>键盘布局</h4><p>由于相同的键码在不同语种情况下显示的字符可能不同，请您自行选择虚拟键盘上需要显示的语种。</p></div>
              <ReferencePill>US-ANSI-Mac⌄</ReferencePill>
            </ReferenceRow>
          </ReferenceGroup>
          <ReferenceGroup>
            <ReferenceRow>
              <div><h4>重置键盘</h4><p>重置键盘将恢复键盘到出厂设置，并删除所有用户配置，请谨慎操作。</p></div>
              <ReferencePill onClick={() => mode === 'connected' && setConfirm('reset')}>重置键盘</ReferencePill>
            </ReferenceRow>
          </ReferenceGroup>
          <ReferenceGroup>
            <ReferenceRow><div><h4>切换语言</h4><p>切换 NuPhyIO 显示语言</p></div><ReferencePill>简体中文⌄</ReferencePill></ReferenceRow>
            <ReferenceRow><div><h4>主题切换</h4><p>切换 NuPhyIO 显示主题，支持亮色、暗色两种模式。</p></div><ReferencePill onClick={toggleTheme}>{theme === 'dark' ? '暗色模式⌄' : '亮色模式⌄'}</ReferencePill></ReferenceRow>
          </ReferenceGroup>
          <ReferenceFooter>
            <FeedbackBox>
              <span>天猫</span><span>京东</span><span>哔哩哔哩</span><span>小红书</span>
              <span className="social-icon"><svg><use href={`${socialSprite}#settingIconChinese2`} /></svg></span>
              <span className="social-icon"><svg><use href={`${socialSprite}#settingIconChinese6`} /></svg></span>
              <span className="social-icon"><svg><use href={`${socialSprite}#settingIconChinese8`} /></svg></span>
              <span className="social-icon"><svg><use href={`${socialSprite}#settingIconChinese5`} /></svg></span>
              <a className="feedback" href="mailto:feedback@nuphy.com">feedback@nuphy.com<br/><small>若您有任何有关于键盘和 NuPhyIO 的建议或问题都可以联系我们。</small></a>
            </FeedbackBox>
            <DownloadBox>
              <DownloadRow><span className="window"><b>NuPhy IO</b><small>M2　Win Profile</small><i>◉</i></span><div><strong>IO Windows版</strong><small>NuPhyIO - V2.2.6 | 2026-06-15</small></div><button>立即下载</button></DownloadRow>
              <DownloadRow><span className="window mac"><b></b><small>M2　Mac Profile</small><i>⌘</i></span><div><strong>IO macOS版</strong><small>NuPhyIO - V2.2.6 | 2026-06-15</small></div><button>立即下载</button></DownloadRow>
            </DownloadBox>
          </ReferenceFooter>
        </ReferenceSettings>

        {/* 通用 */}
        <GroupCard className="settings-general-group" style={{display:'none'}}>
          <SettingItem onClick={toggleTheme}>
            <ItemIcon><GearIcon /></ItemIcon>
            <ItemBody>
              <ItemTitle>{messages.GlobalSettingsPage?.SwitchTheme ?? '主题切换'}</ItemTitle>
              <ItemDesc>{messages.GlobalSettingsPage?.SwitchThemeExplain ?? '切换 NuPhyIO 显示主题,支持亮色、暗色两种模式。'}</ItemDesc>
            </ItemBody>
            <ItemRight><Switch $on={theme === 'dark'} aria-label="主题切换" /></ItemRight>
          </SettingItem>

          <SettingItem onClick={() => setIoModal(true)}>
            <ItemIcon><BookIcon /></ItemIcon>
            <ItemBody>
              <ItemTitle>{messages.GlobalSettingsPage?.IOManual ?? 'IO 手册'}</ItemTitle>
              <ItemDesc>{messages.GlobalSettingsPage?.AuthorizedTipsTitle ?? '授权浏览器连接到您的设备'}</ItemDesc>
            </ItemBody>
            <ItemRight><MiniBtn>查看</MiniBtn></ItemRight>
          </SettingItem>

          <SettingItem
            onClick={() => { if (mode !== 'connected') connect(); }}
          >
            <ItemIcon><UsbIcon /></ItemIcon>
            <ItemBody>
              <ItemTitle>{messages.GlobalSettingsPage?.AuthorizedEquipment ?? '授权设备'}</ItemTitle>
              <ItemDesc>{mode === 'connected' ? name : (messages.GlobalSettingsPage?.AuthorizedTips1 ?? '在浏览器弹出的授权弹窗中选中您的设备并单击「连接」')}</ItemDesc>
            </ItemBody>
            <ItemRight>
              {mode === 'connected' ? (
                <MiniBtn disabled>已授权</MiniBtn>
              ) : (
                <MiniBtn $primary onClick={(e) => { e.stopPropagation(); connect(); }}>
                  {messages.GlobalSettingsPage?.ObtainAuthorization ?? '获取授权'}
                </MiniBtn>
              )}
            </ItemRight>
          </SettingItem>
        </GroupCard>

        {/* 设备 */}
        <GroupCard className="settings-device-group" style={{display:'none'}}>
          <DeviceBox>
            <DeviceImg
              src={theme === 'dark' ? model.board.imageDark : model.board.imageLight}
              alt={model.name}
            />
            <DeviceInfo>
              <DeviceName>{model.name}</DeviceName>
              <ItemDesc>
                工作模式:{' '}
                {mode === 'connected' ? '已连接' : mode === 'demo' ? '演示模式' : '未连接'}
                {protocolVersion >= 0 ? ` · VIA v${protocolVersion}` : ''}
                {layerCount ? ` · ${layerCount} 层` : ''}
                {matrix ? ` · ${matrix.rows}×${matrix.cols} 矩阵` : ''}
              </ItemDesc>
              <ItemDesc>
                VID 0x{model.vendorId.toString(16).toUpperCase()} / PID{' '}
                {model.productIds
                  .map((p) => `0x${p.toString(16).toUpperCase()}`)
                  .join(' / ')}
              </ItemDesc>
            </DeviceInfo>
          </DeviceBox>

          <SettingItem
            onClick={() => mode === 'connected' && setConfirm('reset')}
          >
            <ItemBody>
              <ItemTitle>重置 EEPROM</ItemTitle>
              <ItemDesc>{messages.GlobalSettingsPage?.ResetKeyboardExplain ?? '重置键盘将恢复键盘到出厂设置,并删除所有用户配置,请谨慎操作。'}</ItemDesc>
            </ItemBody>
            <ItemRight>
              <DangerBtn disabled={mode !== 'connected' || busy} onClick={(e) => { e.stopPropagation(); setConfirm('reset'); }}>
                重置
              </DangerBtn>
            </ItemRight>
          </SettingItem>

          <SettingItem
            onClick={() => mode === 'connected' && setConfirm('bootloader')}
          >
            <ItemBody>
              <ItemTitle>进入 Bootloader</ItemTitle>
              <ItemDesc>重启进入刷机模式(用于固件更新),需要重新插拔或按重置键退出。</ItemDesc>
            </ItemBody>
            <ItemRight>
              <MiniBtn disabled={mode !== 'connected' || busy} onClick={(e) => { e.stopPropagation(); setConfirm('bootloader'); }}>
                进入
              </MiniBtn>
            </ItemRight>
          </SettingItem>
        </GroupCard>

        {/* 关于 */}
        <GroupCard className="settings-about-group" style={{display:'none'}}>
          <DeviceBox>
            <DeviceInfo>
              <DeviceName>NuPhy Halo V2 Driver</DeviceName>
              <ItemDesc>
                {messages.GlobalSettingsPage?.VersionNumber ?? '版本号'} v0.1.0
                {mode === 'demo' ? ' · 演示模式' : ''}
              </ItemDesc>
              <ItemDesc>底层基于 VIA 协议(WebHID),UI 复刻 NuPhyIO 原版驱动。</ItemDesc>
            </DeviceInfo>
          </DeviceBox>
        </GroupCard>
      </Panel>

      {ioModal && (
        <Overlay onClick={() => setIoModal(false)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{messages.GlobalSettingsPage?.IOManual ?? 'IO 手册'}</ModalTitle>
            <ModalText>
              {messages.GlobalSettingsPage?.AuthorizedTipsTitle ?? '授权浏览器连接到您的设备'}
              <br />
              {messages.GlobalSettingsPage?.AuthorizedTips1 ?? '在浏览器弹出的授权弹窗中选中您的设备并单击「连接」。'}
              <br />
              {messages.GlobalSettingsPage?.AuthorizedTips2 ?? '若您不想更新固件或不小心关闭了网页,请拔掉键盘重新上电。'}
            </ModalText>
            <ModalBtnRow>
              <MiniBtn onClick={() => setIoModal(false)}>知道了</MiniBtn>
            </ModalBtnRow>
          </ModalBox>
        </Overlay>
      )}

      {confirm && (
        <Overlay onClick={() => !busy && setConfirm(null)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {confirm === 'reset' ? '确认重置 EEPROM?' : '确认进入 Bootloader?'}
            </ModalTitle>
            <ModalText>
              {confirm === 'reset'
                ? (messages.GlobalSettingsPage?.ResetKeyboardExplain ?? '这会清除键盘上所有自定义键位和灯效设置,恢复出厂状态。此操作不可撤销。')
                : '键盘将重启进入引导加载模式,此时键盘无法正常输入,需要重新插拔或按重置键退出。'}
            </ModalText>
            <ModalBtnRow>
              <MiniBtn disabled={busy} onClick={() => setConfirm(null)}>取消</MiniBtn>
              <MiniBtn $primary disabled={busy} onClick={() => runAction(confirm)}>
                {busy ? '执行中…' : '确认执行'}
              </MiniBtn>
            </ModalBtnRow>
          </ModalBox>
        </Overlay>
      )}
    </Page>
  );
};
