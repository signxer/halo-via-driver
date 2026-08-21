import React, {useEffect, useState, useCallback, useRef} from 'react';
import styled from 'styled-components';
import {NavTabs} from '../components/NavTabs';
import {DeviceHeader} from '../components/DeviceHeader';
import {useKeyboardStore} from '../store/keyboard';
import {getMacroAPI, getMacroValidator, isDelaySupported} from '../via/macro-api';
import type {RawKeycodeSequence} from '../via/macro-api/types';
import {RawKeycodeSequenceAction} from '../via/macro-api/types';
import {
  expressionToSequence,
  optimizedSequenceToRawSequence,
  rawSequenceToOptimizedSequence,
  sequenceToExpression,
} from '../via/macro-api/macro-api.common';
import {mapEvtToKeycode} from '../via/key-event';

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
  left: 2.05rem;
  right: 2.05rem;
  bottom: 23.25rem;
  height: 1.875rem;
`;

const Card = styled.div`
  position: fixed;
  left: 2.05rem;
  right: 2.05rem;
  bottom: 0.5rem;
  background: var(--surface-page);
  border-radius: 1.5rem;
  box-shadow: 0 0.125rem 0.5rem var(--black-4);
  padding: .5rem;
  display: flex;
  gap: .5rem;
  /* 与原版 tabBottomContent / 按键页面板同高，保证顶部和 Tab 无下沉。 */
  height: 23.25rem;
  overflow: hidden;
`;

const CardTitle = styled.h2`
  display: none;
  font-size: .875rem;
  font-weight: 900;
  line-height: normal;
  color: var(--text-black-l-title);
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
  flex: 0 0 12.5rem;
  box-sizing: border-box;
  flex-direction: column;
  gap: .5rem;
  overflow-y: auto;
  min-height: 0;
  background: var(--surface-card);
  border-radius: 1rem;
  padding: .5rem;
`;

const MacroItem = styled.div<{$active: boolean}>`
  display: flex;
  align-items: center;
  flex: 0 0 1.5rem;
  width: calc(100% + .5rem);
  box-sizing: border-box;
  border: 0;
  border-radius: .5rem;
  height: 1.5rem;
  padding: .125rem .25rem;
  gap: .125rem;
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
  width: 100%;
  height: 100%;
  gap: .125rem;
  align-items: center;
  margin: 0;
`;

const MacroName = styled.span<{$active: boolean}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 2.0875rem;
  height: 1.028rem;
  box-sizing: border-box;
  padding: .0625rem .5rem .09375rem;
  border-radius: .375rem;
  background: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--button-active-background)')};
  color: ${(p) => (p.$active ? 'var(--button-active-background)' : 'var(--button-active-text)')};
  font-weight: 900;
  font-size: .625rem;
`;

const MacroTitle = styled.span<{$active: boolean}>`
  display: block;
  min-width: 0;
  flex: 1 1 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: normal;
  padding: 0 .125rem;
  color: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--text-black-l-title)')};
  font-size: .75rem;
  font-weight: 700;
`;

const MacroMore = styled.span`
  flex: 0 0 1.25rem;
  width: 1.25rem;
  height: 1.25rem;
  margin-left: auto;
  border-radius: .375rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: inherit;
  font-size: .75rem;
  line-height: 1;
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
  display: flex;
  flex: 0 0 19rem;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: .5rem;
  box-sizing: border-box;
  margin: 0;
  padding: .5rem;
  background: var(--surface-card);
  border-radius: 1rem;
`;

const EditorItem = styled.div`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: .5rem;
  box-sizing: border-box;
  padding: .5rem;
  background: var(--surface-quiet);
  border-radius: .75rem;
`;

const EditorBindings = styled(EditorItem)`
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
`;

const MacroEditorTitle = styled.div`
  font-size: .875rem;
  font-weight: 900;
  line-height: normal;
  color: var(--text-black-l-title);
`;

const CodeHint = styled.div`
  flex: 0 0 auto;
  color: var(--text-black-s-content);
  font-size: .625rem;
  line-height: 1.45;
`;

const CodeActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  gap: .5rem;
`;

const SaveButton = styled.button`
  min-height: 1.75rem;
  padding: .25rem .75rem;
  border: 0;
  border-radius: .375rem;
  background: var(--button-active-background);
  color: var(--button-active-text);
  font-size: .6875rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled { opacity: .5; cursor: not-allowed; }
  &:not(:disabled):hover { opacity: .86; }
`;

const RecorderActions = styled.div`
  display: flex;
  align-items: center;
  gap: .5rem;
`;

const RecorderAction = styled.button<{$active?: boolean}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.75rem;
  padding: .25rem .625rem;
  border: 0;
  border-radius: .375rem;
  background: ${(p) => (p.$active ? 'var(--button-active-background)' : 'var(--button-inactive-background)')};
  color: ${(p) => (p.$active ? 'var(--button-active-text)' : 'var(--text-black-l-title)')};
  font-size: .6875rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  &:hover { opacity: .86; }
`;

const RecorderRows = styled.div`
  max-height: 8.5rem;
  overflow-y: auto;
  font-size: .6875rem;
  color: var(--text-black-l-title);
`;

const RecorderRow = styled.div`
  display: grid;
  grid-template-columns: 2rem 1fr 3rem 4rem 2rem 2rem;
  gap: .5rem;
  align-items: center;
  min-height: 1.5rem;
  border-bottom: 1px solid var(--black-4);
  color: var(--text-black-l-title);
  font-weight: 500;
  text-align: center;
`;

const TextArea = styled.textarea`
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  box-sizing: border-box;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--text-primary);
  resize: none;
  outline: none;
  background: var(--surface-card);
  &:focus {
    border-color: var(--brand);
  }
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
  flex: 1 1 0;
  min-width: 0;
  padding: .75rem .5rem .5rem;
  box-sizing: border-box;
  border-radius: 1rem;
  background: var(--surface-card);
  color: var(--text-black-l-title);
  font-size: .6875rem;
`;

const RecorderTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .5rem;
  font-size: .875rem;
  font-weight: 900;
  line-height: normal;
  color: var(--text-black-l-title);
  padding-bottom: .75rem;
`;

const RecorderHeaders = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1.2fr 1fr 1fr;
  gap: .5rem;
  color: var(--text-black-l-title);
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

// VIA 宏代码格式：{KC_A}、{+KC_LSFT}、{-KC_LSFT}、{50}，普通文字可直接输入。
const sequenceToCode = (sequence: RawKeycodeSequence | undefined): string =>
  sequenceToExpression(rawSequenceToOptimizedSequence(sequence ?? []));

export const MacroPage: React.FC = () => {
  const {mode, api, protocolVersion, initDemo} = useKeyboardStore();

  const [macros, setMacros] = useState<RawKeycodeSequence[]>([]);
  const [active, setActive] = useState<number>(0);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<RawKeycodeSequence>([]);
  const lastRecordAt = useRef(0);

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
      setText(sequenceToCode(sequences[0]));
      setRecorded(sequences[0] ?? []);
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
    setText(sequenceToCode(macros[i]));
    setError(null);
    setRecorded(macros[i] ?? []);
  };

  useEffect(() => {
    if (!recording) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.repeat || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      const keycode = mapEvtToKeycode(event);
      if (!keycode) return;
      event.preventDefault();
      const now = Date.now();
      const elapsed = lastRecordAt.current ? Math.round(now - lastRecordAt.current) : 0;
      const next = [...recorded];
      if (elapsed > 0) next.push([RawKeycodeSequenceAction.Delay, Math.min(9999, elapsed)]);
      next.push([RawKeycodeSequenceAction.Tap, keycode]);
      lastRecordAt.current = now;
      setRecorded(next);
      setText(sequenceToCode(next));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [recording, recorded]);

  const startRecording = () => {
    lastRecordAt.current = 0;
    setRecorded([]);
    setText('');
    setError(null);
    setRecording(true);
  };

  const clearRecording = () => {
    setRecorded([]);
    setText('');
    setError(null);
  };

  const saveMacro = async () => {
    if (active < 0) return;
    const validation = getMacroValidator(protocolVersion)(text);
    if (!validation.isValid) {
      setError(validation.errorMessage ?? '宏代码格式错误');
      return;
    }
    if (!isDelaySupported(protocolVersion) && /\{\d+\}/.test(text)) {
      setError('当前键盘固件协议不支持 Delay 指令');
      return;
    }
    try {
      const newSeq = optimizedSequenceToRawSequence(expressionToSequence(text));
      const next = [...macros];
      next[active] = newSeq;
      setSaving(true);
      if (mode === 'connected' && api) {
        const macroApi = getMacroAPI(protocolVersion, 13, api);
        await macroApi.writeRawKeycodeSequences(next);
      }
      setMacros(next);
      setRecorded(newSeq);
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
                  <MacroTitle $active={i === active}>MACRO {i + 1}</MacroTitle>
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
          <EditorItem>
            <MacroEditorTitle>MACRO {active >= 0 ? active + 1 : 1}</MacroEditorTitle>
          </EditorItem>
          <EditorBindings>
            <MacroEditorTitle>宏代码</MacroEditorTitle>
            <TextArea
              aria-label="宏内容"
              value={active >= 0 ? text : ''}
              onChange={(e) => setText(e.target.value)}
              placeholder={'{KC_A}{+KC_LSFT}hello{-KC_LSFT}{50}'}
            />
            <CodeHint>
              {`{KC_A} 按键　{+KC_LSFT} 按下　{-KC_LSFT} 释放　{50} 延时；普通文字可直接输入。`}
            </CodeHint>
            {error && <ErrorMsg>⚠️ {error}</ErrorMsg>}
            <CodeActions>
              <SaveButton onClick={saveMacro} disabled={saving || active < 0}>
                {saving ? '保存中…' : '保存宏代码'}
              </SaveButton>
            </CodeActions>
          </EditorBindings>
        </Editor>
        <Recorder>
          <RecorderTitle>
            <span>宏键录制</span>
            <RecorderActions>
              <RecorderAction onClick={clearRecording}>清除数据</RecorderAction>
              <RecorderAction $active={recording} onClick={() => recording ? setRecording(false) : startRecording()}>
                {recording ? '停止录制' : '开始录制'}
              </RecorderAction>
            </RecorderActions>
          </RecorderTitle>
          <RecorderHeaders><span>序号</span><span>按键</span><span>状态</span><span>时间(ms)</span><span>向上插入</span><span>向下插入</span></RecorderHeaders>
          {recorded.length === 0 ? <div style={{textAlign:'center',paddingTop:'5rem'}}>数据逃跑了</div> : (
            <RecorderRows>
              {recorded.map(([action, payload], index) => (
                <RecorderRow key={`${index}-${action}-${payload}`}>
                  <span>{index + 1}</span><span>{String(payload)}</span><span>{action === RawKeycodeSequenceAction.Delay ? '延时' : '按下'}</span><span>{action === RawKeycodeSequenceAction.Delay ? payload : '—'}</span><span>↑</span><span>↓</span>
                </RecorderRow>
              ))}
            </RecorderRows>
          )}
        </Recorder>
      </Card>
    </Page>
  );
};
