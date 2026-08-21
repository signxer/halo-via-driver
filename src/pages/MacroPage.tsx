import React, {useEffect, useState, useCallback} from 'react';
import styled from 'styled-components';
import {NavTabs} from '../components/NavTabs';
import {DeviceHeader} from '../components/DeviceHeader';
import {useKeyboardStore} from '../store/keyboard';
import {getMacroAPI, isDelaySupported} from '../via/macro-api';
import type {RawKeycodeSequence} from '../via/macro-api/types';
import {RawKeycodeSequenceAction} from '../via/macro-api/types';

const Page = styled.div`
  padding: 0 1.55rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: none;
  margin: 0 auto;
  width: 100%;
`;

const PageNav = styled.div`
  position: fixed;
  z-index: 11;
  left: 1.9rem;
  right: 1.9rem;
  bottom: 23.25rem;
  height: 1.875rem;
`;

const Card = styled.div`
  position: fixed;
  left: 1.9rem;
  right: 1.9rem;
  bottom: 0.5rem;
  background: var(--surface-page);
  border-radius: 1.5rem;
  box-shadow: 0 0.125rem 0.5rem var(--black-4);
  padding: .5rem 1rem;
  display: grid;
  grid-template-columns: 12rem 19rem minmax(0, 1fr);
  gap: 0.625rem;
  /* 与原版 tabBottomContent / 按键页面板同高，保证顶部和 Tab 无下沉。 */
  height: 23.25rem;
  overflow: hidden;
`;

const CardTitle = styled.h2`
  display: none;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 4px;
`;

const CardSub = styled.p`
  display: none;
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  margin-bottom: 16px;
`;

const MacroList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  overflow-y: auto;
  min-height: 0;
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 0;
`;

const MacroItem = styled.div<{$active: boolean}>`
  border: 0;
  border-radius: 0.5rem;
  height: 1.875rem;
  padding: 0.3rem 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${(p) => (p.$active ? 'var(--button-active-background)' : 'transparent')};
  color: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--text-primary)')};

  &:hover {
    border-color: var(--brand);
  }
`;

const MacroHeader = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin: 0;
`;

const MacroName = styled.span<{$active: boolean}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1rem;
  margin-right: .375rem;
  border-radius: .5rem;
  background: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--button-active-background)')};
  color: ${(p) => (p.$active ? 'var(--button-active-background)' : 'var(--button-active-text)')};
  font-weight: 700;
  font-size: 0.6875rem;
`;

const MacroMore = styled.span`
  margin-left: auto;
  width: 1rem;
  height: 1rem;
  border-radius: .375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--black-12);
  font-size: .625rem;
`;

const MacroPreview = styled.div`
  display: none;
  font-size: 0.625rem;
  color: var(--text-secondary);
  font-family: 'SF Mono', Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
  max-height: 1rem;
  overflow: hidden;
`;

const Editor = styled.div`
  margin: 0;
  padding: .75rem .5rem .5rem;
  background: var(--surface-quiet);
  border-radius: .75rem;
`;

const MacroEditorTitle = styled.div`
  font-size: .75rem;
  font-weight: 700;
  margin-bottom: 1rem;
`;

const IntervalRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: .6875rem;
  margin-bottom: .375rem;
`;

const IntervalButtons = styled.div`
  display: flex;
  gap: .25rem;
  margin-bottom: 1.8rem;
  button {
    height: 1.5rem;
    padding: 0 .75rem;
    border-radius: .5rem;
    font-size: .625rem;
    font-weight: 600;
    background: var(--black-4);
    color: var(--text-black-l-title);
  }
  button:first-child { background: var(--button-active-background); color: var(--button-active-text); }
`;

const BindingTitle = styled.div`
  font-size: .6875rem;
  font-weight: 600;
  margin-bottom: .5rem;
`;

const BindingSlots = styled.div`
  display: flex;
  gap: .375rem;
`;

const BindingSlot = styled.div<{$plus?: boolean}>`
  width: 2.75rem;
  height: 2.75rem;
  border: 1px dashed var(--black-16);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-black-s-content);
  font-size: .5625rem;
  background: ${(p) => (p.$plus ? 'var(--surface-card)' : 'var(--surface-quiet)')};
  flex-direction: column;
  &::after { content: ${(p) => (p.$plus ? "'+'" : "'--'")}; margin-top: .25rem; color: var(--text-black-s-content); }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 4rem;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--text-primary);
  resize: vertical;
  outline: none;
  &:focus {
    border-color: var(--brand);
  }
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  gap: 12px;
  flex-wrap: wrap;
`;

const ErrorMsg = styled.div`
  color: var(--accent);
  font-size: 0.6875rem;
  margin-top: 8px;
`;

const Empty = styled.div`
  color: var(--text-tertiary);
  font-size: 0.75rem;
  text-align: center;
  padding: 40px 0;
`;

const Recorder = styled.div`
  position: relative;
  min-width: 0;
  padding: .75rem .5rem .5rem;
  border-radius: .75rem;
  background: var(--surface-quiet);
  color: var(--text-black-s-content);
  font-size: .6875rem;
`;

const RecorderTitle = styled.div`
  font-size: .75rem;
  font-weight: 700;
  color: var(--text-black-l-title);
  padding-bottom: .75rem;
`;

const RecorderHeaders = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1.2fr 1fr 1fr;
  gap: .5rem;
  color: var(--text-black-s-content);
  font-size: .5625rem;
  text-align: center;
  padding: .75rem 0 .5rem;
`;

// 序列 → 可编辑文本(示例:Tap A, Delay 50, Char "hello")
function sequenceToText(seq: RawKeycodeSequence | undefined): string {
  if (!seq || seq.length === 0) return '';
  return seq
    .map(([action, payload]) => {
      switch (action) {
        case RawKeycodeSequenceAction.Tap:
          return `Tap ${payload}`;
        case RawKeycodeSequenceAction.Down:
          return `Down ${payload}`;
        case RawKeycodeSequenceAction.Up:
          return `Up ${payload}`;
        case RawKeycodeSequenceAction.Delay:
          return `Delay ${payload}`;
        case RawKeycodeSequenceAction.CharacterStream:
          return `Type "${payload}"`;
        default:
          return '';
      }
    })
    .join('\n');
}

// 解析多行文本 → 序列。每行:Tap KC_A / Down KC_LSFT / Delay 50 / Type "hello"
function textToSequence(text: string): RawKeycodeSequence {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const seq: RawKeycodeSequence = [];
  for (const line of lines) {
    const tap = line.match(/^Tap\s+(.+)$/i);
    const down = line.match(/^Down\s+(.+)$/i);
    const up = line.match(/^Up\s+(.+)$/i);
    const delay = line.match(/^Delay\s+(\d+)$/i);
    const type = line.match(/^Type\s+"(.+)"$/i);
    if (tap) seq.push([RawKeycodeSequenceAction.Tap, tap[1].trim()]);
    else if (down) seq.push([RawKeycodeSequenceAction.Down, down[1].trim()]);
    else if (up) seq.push([RawKeycodeSequenceAction.Up, up[1].trim()]);
    else if (delay) seq.push([RawKeycodeSequenceAction.Delay, Number(delay[1])]);
    else if (type) seq.push([RawKeycodeSequenceAction.CharacterStream, type[1]]);
    else throw new Error(`无法解析的行: ${line}`);
  }
  return seq;
}

export const MacroPage: React.FC = () => {
  const {mode, api, protocolVersion, initDemo} = useKeyboardStore();

  const [macros, setMacros] = useState<RawKeycodeSequence[]>([]);
  const [active, setActive] = useState<number>(0);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'disconnected') initDemo();
    if (mode === 'demo') setMacros(Array.from({length: 32}, () => []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 读取宏
  const loadMacros = useCallback(async () => {
    if (mode !== 'connected' || !api) {
      setMacros(Array.from({length: 32}, () => []));
      return;
    }
    setLoading(true);
    try {
      const macroApi = getMacroAPI(protocolVersion, 13, api);
      const sequences = await macroApi.readRawKeycodeSequences();
      setMacros(sequences);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? '读取宏失败');
    } finally {
      setLoading(false);
    }
  }, [mode, api, protocolVersion]);

  useEffect(() => {
    if (mode === 'connected') {
      loadMacros();
    }
  }, [mode, loadMacros]);

  const selectMacro = (i: number) => {
    setActive(i);
    setText(sequenceToText(macros[i]));
    setError(null);
  };

  const saveMacro = async () => {
    if (mode !== 'connected' || !api || active < 0) return;
    // 校验延迟支持
    if (!isDelaySupported(protocolVersion) && /delay/i.test(text)) {
      setError('当前键盘固件协议不支持 Delay 指令');
      return;
    }
    try {
      const newSeq = textToSequence(text);
      const next = [...macros];
      next[active] = newSeq;
      const macroApi = getMacroAPI(protocolVersion, 13, api);
      setSaving(true);
      await macroApi.writeRawKeycodeSequences(next);
      setMacros(next);
      setError(null);
      setSaving(false);
    } catch (e: any) {
      setSaving(false);
      setError(e?.message ?? '保存失败');
    }
  };

  const macroCount = macros.length;

  return (
    <Page>
      <DeviceHeader />
      <PageNav><NavTabs /></PageNav>
      <Card>
        <CardTitle>🪄 宏管理</CardTitle>
        <CardSub>
          宏通过「宏键」触发。可编辑 {macroCount} 个宏(macros{' '}
          {mode === 'demo' ? '· 演示模式,需连接键盘' : ''})
        </CardSub>

        {loading ? (
          <Empty>读取宏中…</Empty>
        ) : (
          <MacroList>
            {macros.map((seq, i) => (
              <MacroItem key={i} $active={i === active} onClick={() => selectMacro(i)}>
                <MacroHeader>
                  <MacroName $active={i === active}>M{i + 1}</MacroName>
                  <span style={{fontSize: '0.625rem', color: i === active ? '#fff' : 'var(--text-black-s-content)'}}>MACRO {i + 1}</span>
                  {i === active && <MacroMore>•••</MacroMore>}
                </MacroHeader>
                <MacroPreview>
                  {sequenceToText(seq) || '空宏'}
                </MacroPreview>
              </MacroItem>
            ))}
          </MacroList>
        )}

        <Editor>
          <MacroEditorTitle>MACRO {active >= 0 ? active + 1 : 1}</MacroEditorTitle>
          <IntervalRow><span>间隔时间</span><span>－　ms</span></IntervalRow>
          <IntervalButtons><button>实际间隔时间</button><button>默认间隔时间</button></IntervalButtons>
          <BindingTitle>按键绑定</BindingTitle>
          <BindingSlots>
            <BindingSlot>待分配</BindingSlot>
            <BindingSlot>待分配</BindingSlot>
            <BindingSlot>待分配</BindingSlot>
            <BindingSlot $plus>＋</BindingSlot>
          </BindingSlots>
          <div style={{display:'none'}}>
          <TextArea
            value={active >= 0 ? text : ''}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Tap KC_A\nDown KC_LSFT\nDelay 50'}
          />
          {error && <ErrorMsg>⚠️ {error}</ErrorMsg>}
          <Toolbar>
            <span style={{fontSize: '0.625rem', color: 'var(--text-tertiary)'}}>按键绑定　　待分配　　待分配　　＋ 新建绑定</span>
            <button className="btn-primary" onClick={saveMacro} disabled={saving || active < 0}>
              {saving ? '保存中…' : '保存宏'}
            </button>
          </Toolbar>
          </div>
        </Editor>
        <Recorder>
          <RecorderTitle>宏键录制 <span style={{float:'right',fontWeight:500}}>开始录制</span></RecorderTitle>
          <RecorderHeaders><span>序号</span><span>按键</span><span>状态</span><span>时间(ms)</span><span>向上插入</span><span>向下插入</span></RecorderHeaders>
          <div style={{textAlign:'center',paddingTop:'5rem'}}>数据逃跑了</div>
        </Recorder>
        {false && (
          <Editor>
            <div style={{fontSize: 13, fontWeight: 600, marginBottom: 8}}>
              编辑 Macro {active + 1}
            </div>
            <TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'Tap KC_A\nDown KC_LSFT\nDelay 50\nType "hello"'}
            />
            {error && <ErrorMsg>⚠️ {error}</ErrorMsg>}
            <Toolbar>
              <span style={{fontSize: 12, color: 'var(--text-tertiary)'}}>
                每行一个动作:Tap / Down / Up / Delay / Type
              </span>
              <button
                className="btn-primary"
                onClick={saveMacro}
                disabled={saving}
              >
                {saving ? '保存中…' : '保存宏'}
              </button>
            </Toolbar>
          </Editor>
        )}
      </Card>
    </Page>
  );
};
