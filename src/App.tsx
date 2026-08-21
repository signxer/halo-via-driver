import {useEffect} from 'react';
import {Routes, Route, Navigate, useLocation} from 'react-router-dom';
import styled from 'styled-components';
import {FixTop} from './components/FixTop';
import {PressKeyPage} from './pages/PressKeyPage';
import {LightingPage} from './pages/LightingPage';
import {MacroPage} from './pages/MacroPage';
import {SettingsPage} from './pages/SettingsPage';
import {ConnectPage} from './pages/ConnectPage';
import {useKeyboardStore} from './store/keyboard';
import {KeyTestPanel} from './components/KeyTestPanel';

// ============================================================
// 复刻原版布局 (drive.nuphyio.com)
// appContainerBac(padding + 背景图) > fixTop + pageContainer
// 未连接设备时显示原版首页风格连接页
// ============================================================

const AppContainerBac = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100vh;
  background-color: var(--box-nested-white-xl-max);
  padding: 0.5rem;
  background-image: var(--app-background-image);
  background-position: center bottom;
  background-size: cover;
  background-attachment: fixed;
  overflow: hidden;
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  width: 100%;
`;

function ComingSoon() {
  return (
    <div
      style={{
        padding: '5rem',
        textAlign: 'center',
        color: 'var(--text-black-s-content)',
      }}
    >
      <p style={{fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem'}}>
        此功能暂未支持
      </p>
      <p style={{fontSize: '0.75rem', color: 'var(--text-black-s-content)'}}>
        该功能需要磁轴键盘或 VIA 协议暂不支持的操作,本驱动未包含。
      </p>
    </div>
  );
}

function MainShell() {
  return (
    <PageContainer className="pageContainer">
      <Routes>
        <Route path="/" element={<Navigate to="/pressKey" replace />} />
        <Route path="/pressKey" element={<PressKeyPage />} />
        <Route path="/light" element={<LightingPage />} />
        <Route path="/macro" element={<MacroPage />} />
        <Route path="/setting" element={<SettingsPage />} />
        <Route path="/performance" element={<ComingSoon />} />
        <Route path="/advancedKey" element={<ComingSoon />} />
        <Route path="/gamepad" element={<ComingSoon />} />
        <Route path="/modeSetting" element={<ComingSoon />} />
        <Route path="*" element={<Navigate to="/pressKey" replace />} />
      </Routes>
    </PageContainer>
  );
}

function App() {
  const {mode, tryAutoConnect, initDemo} = useKeyboardStore();
  const location = useLocation();

  // 打开页面时自动连接已授权的设备
  useEffect(() => {
    // HashRouter 下 query 可能在 hash 内外,统一从完整 URL 读取
    const href = window.location.href;
    const beforeHash = href.split('#')[0];
    const params = new URLSearchParams(
      beforeHash.includes('?') ? beforeHash.split('?')[1] : '',
    );
    if (params.get('demo') === '1' || params.get('isDemoMode') === 'true') {
      initDemo();
      return;
    }
    tryAutoConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 未连接 → 连接页;设置页在未连接时也可进入(主题/IO 说明等不需要设备)
  const allowSetting = location.pathname.startsWith('/setting');
  if (mode === 'disconnected' && !allowSetting) {
    return (
      <AppContainerBac>
        <ConnectPage />
      </AppContainerBac>
    );
  }

  return (
    <AppContainerBac>
      <FixTop />
      {!allowSetting && <KeyTestPanel />}
      <MainShell />
    </AppContainerBac>
  );
}

export default App;
