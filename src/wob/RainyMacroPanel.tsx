import {useState} from 'react';
import {requestRainy} from './device';
import {readMacros,writeMacros} from './transport';
import {decodeMacros,encodeMacros,type WobMacro} from './macros';
import './rainy-studio.css';
function download(data:Uint8Array){
 const url=URL.createObjectURL(new Blob([JSON.stringify({format:'rainy75-wob-macros-backup-v1',rawHex:Array.from(data,b=>b.toString(16).padStart(2,'0')).join(' '),date:new Date().toISOString()},null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='rainy75-macros-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function RainyMacroPanel(){
 const [original,setOriginal]=useState<Uint8Array|null>(null);
 const [macros,setMacros]=useState<WobMacro[]>([]);
 const [selected,setSelected]=useState(0);
 const [text,setText]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('先读取键盘中的宏；只编辑所选宏，其余宏会保留。');
 async function read(){setBusy(true);let d:HIDDevice|null=null;try{
  d=await requestRainy();const raw=await readMacros(d);const list=raw.length?decodeMacros(raw):[];
  setOriginal(raw);setMacros(list);setSelected(0);setText(JSON.stringify(list[0]??[],null,2));setMessage(`已读取 ${list.length} 个宏。`);
 }catch(e){setMessage(String(e));}finally{setBusy(false);if(d?.opened)await d.close().catch(()=>{});}}
 function stage(){try{
  const actions:unknown=JSON.parse(text);
  if(!Array.isArray(actions))throw new Error('请输入动作数组');
  const next=macros.slice();next[selected]=actions as WobMacro;encodeMacros(next);setMacros(next);setMessage('已暂存到本地，尚未写入键盘。');
 }catch(e){setMessage(String(e));}}
 async function apply(){if(!original)return;setBusy(true);let d:HIDDevice|null=null;try{
  const payload=encodeMacros(macros);download(original);d=await requestRainy();
  const actual=await writeMacros(d,original,payload);setOriginal(actual);setMessage('宏数据写入并回读一致。可在按键页将普通键指派为对应宏。');
 }catch(e){setMessage('写入未确认：'+String(e));}finally{setBusy(false);if(d?.opened)await d.close().catch(()=>{});}}
 return <section className="rainy-studio">
  <header className="rainy-studio-header"><div><h2>Rainy75 宏</h2><p>读取、编辑、备份与回读验证</p></div><button disabled={busy} onClick={()=>void read()}>连接并读取宏</button></header>
  <p role="status">{message}</p>
  {original&&<div className="rainy-studio-body"><div>
   <label>选择宏 <select value={selected} disabled={busy} onChange={e=>{const i=Number(e.target.value);setSelected(i);setText(JSON.stringify(macros[i]??[],null,2));}}>{macros.map((_,i)=><option key={i} value={i}>宏 {i+1}</option>)}</select></label>
   <button disabled={busy||macros.length>=16} onClick={()=>{const next=[...macros,[]];setMacros(next);setSelected(next.length-1);setText('[]');}}>新增宏</button>
   <textarea aria-label="宏动作" disabled={busy} value={text} onChange={e=>setText(e.target.value)} style={{display:'block',width:'100%',height:190,marginTop:8}}/>
   <button disabled={busy||!macros.length} onClick={stage}>暂存本地修改</button>
   <button disabled={busy} onClick={()=>download(original)}>原始备份</button>
   <button disabled={busy} onClick={()=>void apply()}>写入已暂存的宏并回读</button>
  </div><div><p>动作格式：delay 为毫秒；action 138 为普通键按下，10 为抬起；key 为 USB HID 键码。</p><pre>{JSON.stringify([{delay:0,action:138,key:4},{delay:50,action:10,key:4}],null,2)}</pre><p>示例为按下并释放 A。每个宏最多 90 个动作。暂存后再写入；未暂存的文本不会发送。</p><p>特殊动作字段按原厂格式保留。保存后，在按键页选择目标键并指派“宏 1”等对应项。</p></div></div>}
 </section>;
}
