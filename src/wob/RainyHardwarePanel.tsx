import {useEffect, useState} from 'react';
import {EFFECTS, requestRainy, sendLighting, type WobMode, type WobBrightness, type WobSpeed} from './device';
import './rainy-studio.css';
const MULTICOLOR = [4, 11, 12];
const PRESETS = ['#c8a2ff','#ff5c72','#ffb347','#ffe36e','#69d8ad','#5cb8ff','#ffffff','#ff00aa'];
const SPEED = ['最快','较快','中等','较慢','最慢'];
export function RainyHardwarePanel() {
 const [device,setDevice] = useState<HIDDevice|null>(null);
 const [mode,setMode] = useState<WobMode>(6);
 const [color,setColor] = useState('#c8a2ff');
 const [brightness,setBrightness] = useState<WobBrightness>(4);
 const [speed,setSpeed] = useState<WobSpeed>(4);
 const [busy,setBusy] = useState(false);
 const [status,setStatus] = useState('尚未连接 · 请先关闭 WOB 原厂驱动');
 const [log,setLog] = useState('');
 const [advanced,setAdvanced] = useState(false);
 const [sent,setSent] = useState(false);
 useEffect(()=>()=>{if(device?.opened)void device.close().catch(()=>{});},[device]);
 const effect = EFFECTS.find(e=>e.id===mode);
 const multicolor = MULTICOLOR.includes(mode);
 useEffect(()=>{
  const handler=(event:HIDConnectionEvent)=>{if(device && event.device===device){setDevice(null);setSent(false);setStatus('键盘已断开连接');}};
  navigator.hid?.addEventListener('disconnect',handler);
  return ()=>navigator.hid?.removeEventListener('disconnect',handler);
 },[device]);
 async function connect(){setBusy(true);try{const d=await requestRainy();setDevice(d);setSent(false);setStatus('Rainy 75 已连接，可以发送灯光设置');}catch(e){setStatus('连接失败：'+String(e));}finally{setBusy(false);}}
 async function disconnect(){setBusy(true);try{if(device?.opened)await device.close();setDevice(null);setSent(false);setStatus('已断开连接');}catch(e){setStatus('断开失败：'+String(e));}finally{setBusy(false);}}
 async function apply(){if(!device||busy)return;setBusy(true);try{
  const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)) as [number,number,number];
  const report=await sendLighting(device,mode,rgb,brightness,speed);
  setSent(true);setStatus('设置回读一致，请以键盘实际灯效为准');
  setLog(old=>`${new Date().toLocaleTimeString()} | mode=${mode} color=${color} brightness=${brightness} speed=${speed} | ${report}\n${old}`.slice(0,12000));
 }catch(e){setSent(false);setStatus('发送失败：'+String(e));}finally{setBusy(false);}}
 return <section className="rainy-studio">
  <header className="rainy-studio-header">
   <div><div className="rainy-eyebrow">RAINY CONTROL / LIGHTING STUDIO</div><h2>灯光控制 <span className="rainy-version">ALPHA 6</span></h2><p>19 种原厂灯效 · 5 档亮度 · 5 档速度</p></div>
   <div className="rainy-connect"><span className={'rainy-dot '+(device?'online':'')}/><span>{device?'Rainy 75 已连接':'设备未连接'}</span><button disabled={busy} onClick={()=>void(device?disconnect():connect())}>{busy?'请稍候…':device?'断开连接':'连接键盘'}</button></div>
  </header>
  <div className="rainy-studio-body">
   <div className="rainy-effect-area"><div className="rainy-section-head"><h3>灯效模式</h3><span>选择灯效后点击应用</span></div><div className="rainy-effects">
    {EFFECTS.map(e=><button key={e.id} className={'rainy-effect '+(mode===e.id?'selected':'')} aria-pressed={mode===e.id} onClick={()=>{setMode(e.id);setSent(false);}}>
     <span className="rainy-effect-icon">{e.id===20?'◌':e.id===6?'●':e.id===5?'◉':'✦'}</span><span className="rainy-effect-name">{e.name.split(' · ')[0]}</span><span className="rainy-effect-en">{e.name.split(' · ')[1]}</span>{MULTICOLOR.includes(e.id)&&<span className="rainy-multi-tag">多色</span>}
    </button>)}
   </div></div>
   <div className="rainy-controls"><div className="rainy-section-head"><h3>效果设置</h3><span>{effect?.name}</span></div>
    <div className="rainy-preview"><div className={'rainy-preview-glow '+(mode===5?'breathing':'')} style={{background:mode===20?'#242a38':multicolor?'linear-gradient(120deg,#f472b6,#fbbf24,#34d399,#60a5fa,#a78bfa)':color,opacity:mode===20?.25:.25+brightness*.1875}}/><span>{mode===20?'灯光关闭':effect?.name.split(' · ')[0]}</span><small>视觉示意 · 非实时键盘反馈</small></div>
    <div className="rainy-control-label"><label htmlFor="rainy-color">灯光颜色</label><span>{color.toUpperCase()}</span></div>
    <div className="rainy-color-row"><input id="rainy-color" type="color" value={color} onChange={e=>{setColor(e.target.value);setSent(false);}}/><div className="rainy-swatches">{PRESETS.map(c=><button key={c} title={c} aria-label={'选择颜色 '+c} className={c===color?'active':''} style={{background:c}} onClick={()=>{setColor(c);setSent(false);}}/>)}</div></div>
    {multicolor&&<div className="rainy-notice">此灯效使用多色动画，单色 RGB 设置可能不会生效。</div>}
    <div className="rainy-control-label"><label htmlFor="rainy-brightness">亮度</label><span>Level {brightness} / 4</span></div>
    <input id="rainy-brightness" className="rainy-range" type="range" min="0" max="4" step="1" value={brightness} onChange={e=>{setBrightness(Number(e.target.value) as WobBrightness);setSent(false);}}/><div className="rainy-range-labels"><span>最低 · 0</span><span>最高 · 4</span></div>
    <div className="rainy-control-label"><label htmlFor="rainy-speed">动画速度</label><span>{SPEED[speed]} · Level {speed}</span></div>
    <input id="rainy-speed" className="rainy-range" type="range" min="0" max="4" step="1" value={speed} onChange={e=>{setSpeed(Number(e.target.value) as WobSpeed);setSent(false);}}/><div className="rainy-range-labels"><span>最快 · 0</span><span>最慢 · 4</span></div>
    <button className="rainy-apply" disabled={!device||busy} onClick={()=>void apply()}>{busy?'正在发送…':'应用灯光设置'}</button>
    <div className={'rainy-status '+(sent?'success':'')} role="status">{status}</div>
    <button className="rainy-advanced-toggle" onClick={()=>setAdvanced(v=>!v)} aria-expanded={advanced}>{advanced?'▾':'▸'} 高级设置与 HID 调试</button>
    {advanced&&<div className="rainy-debug"><p>键位和宏仍为演示功能，不会向 WOB 发送 VIA 写入。</p><textarea readOnly aria-label="HID 日志" value={log} placeholder="发送指令后显示日志"/><button disabled={!log} onClick={()=>void navigator.clipboard?.writeText(log)}>复制日志</button></div>}
   </div>
  </div>
 </section>;
}
