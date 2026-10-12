import {useMemo, useState} from 'react';
import {requestRainy} from './device';

import {readKeymap, writeKeymap} from './transport';
import {PHYSICAL_SLOTS, ordinaryUsage, editableSlot, editMacroKey, editOrdinaryKey} from './protocol';
function hex(bytes:Uint8Array){return Array.from(bytes,v=>v.toString(16).padStart(2,'0')).join(' ');}
const labels:Record<number,string>={4:'A',5:'B',6:'C',7:'D',8:'E',9:'F',10:'G',11:'H',12:'I',13:'J',14:'K',15:'L',16:'M',17:'N',18:'O',19:'P',20:'Q',21:'R',22:'S',23:'T',24:'U',25:'V',26:'W',27:'X',28:'Y',29:'Z',40:'Enter',41:'Esc',42:'Backspace',43:'Tab',44:'Space',57:'Caps Lock',224:'Left Ctrl'};
const navigation:Record<number,string>={45:'-',46:'=',47:'[',48:']',49:'\\',50:'ISO #',51:';',52:"'",53:'`',54:',',55:'.',56:'/',70:'Print',71:'Scroll',72:'Pause',73:'Insert',74:'Home',75:'PgUp',76:'Delete',77:'End',78:'PgDn',79:'→',80:'←',81:'↓',82:'↑'};
function keyName(v:number){return labels[v]??navigation[v]??(v>=58&&v<=69?'F'+(v-57):undefined)??(v>=30&&v<=39?String((v-29)%10):'0x'+v.toString(16).toUpperCase().padStart(2,'0'));}
export function RainyKeymapReader(){
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('连接后读取真实主层键位；修改先保存在本地，点击写入才应用到键盘。');
 const [data,setData]=useState<Uint8Array|null>(null);
 const [draft,setDraft]=useState<Uint8Array|null>(null);
 const [selected,setSelected]=useState<number>(48);
 const [newKey,setNewKey]=useState<number>(41);
 const changes=useMemo(()=>data&&draft?Array.from({length:128},(_,i)=>i).filter(i=>data[i*3]!==draft[i*3]||data[i*3+1]!==draft[i*3+1]||data[i*3+2]!==draft[i*3+2]):[],[data,draft]);
 const rows=[
  {title:'功能键',ids:PHYSICAL_SLOTS.slice(0,15)},
  {title:'数字区',ids:PHYSICAL_SLOTS.slice(15,30)},
  {title:'Q 行',ids:PHYSICAL_SLOTS.slice(30,44)},
  {title:'A 行',ids:PHYSICAL_SLOTS.slice(44,59)},
  {title:'Z 行',ids:PHYSICAL_SLOTS.slice(59,73)},
  {title:'空格及方向区',ids:PHYSICAL_SLOTS.slice(73)},
 ];
 const editableKeys=[...Array.from({length:26},(_,i)=>({code:i+4,name:String.fromCharCode(65+i)})),
  ...Array.from({length:10},(_,i)=>({code:i+30,name:String((i+1)%10)})),
  ...[40,41,42,43,44,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,224,225,226,227,228,229,230,231].map(code=>({code,name:keyName(code)}))];
 function stage(){
  if(!data||!draft)return;
  if(!editableSlot(data,selected)){setMessage('此位置不是已确认的普通键编码（20 00 XX），禁止编辑特殊功能字段。');return;}
  const next=newKey>=256?editMacroKey(draft,selected,newKey-256):editOrdinaryKey(draft,selected,newKey);setDraft(next);
  setMessage('已在本地预览修改。尚未向键盘写入任何内容。');
 }
 function resetDraft(){if(data){setDraft(data.slice());setMessage('已撤销所有本地预览修改。键盘配置未改变。');}}
 function exportDraft(){
  if(!data||!draft)return;
  const payload={format:'rainy75-wob-keymap-draft-v1',date:new Date().toISOString(),writeEnabled:true,
   originalHex:hex(data),draftHex:hex(draft),changes:changes.map(i=>({index:i,before:hex(data.slice(i*3,i*3+3)),after:hex(draft.slice(i*3,i*3+3))}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='rainy75-keymap-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 
 async function read(){
  setBusy(true);setData(null);setDraft(null);
  let device:HIDDevice|null=null;
  try{
   device=await requestRainy();
   const output=await readKeymap(device);
   setData(output);setDraft(output.slice());setMessage('已读取 384 字节，按原厂 81 键布局显示。修改先保存在本地。');
  }catch(e){setMessage('读取失败：'+String(e instanceof Error?e.message:e));}
  finally{setBusy(false);if(device?.opened)await device.close().catch(()=>{});}
 }
 async function apply(){
  if(!data||!draft||busy)return;
  // Retain a downloadable backup before the first hardware write.
  save();setBusy(true);let device:HIDDevice|null=null;
  try{
   device=await requestRainy();
   const actual=await writeKeymap(device,data,draft);
   setData(actual);setDraft(actual.slice());setMessage('写入完成，384 字节回读与草稿一致。请用实际按键确认；断电后的保存仍需实机验证。');
  }catch(e){setMessage('写入未确认：'+String(e instanceof Error?e.message:e));}
  finally{setBusy(false);if(device?.opened)await device.close().catch(()=>{});}
 }
 function save(){
  if(!data)return;
  const payload={format:'rainy75-wob-keymap-readonly-v1',date:new Date().toISOString(),length:data.length,rawHex:hex(data),entries:Array.from({length:data.length/3},(_,i)=>({index:i,raw:hex(data.slice(i*3,i*3+3))}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='rainy75-keymap-readonly.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <section style={{position:'fixed',zIndex:20,bottom:'.5rem',left:'2.05rem',right:'2.05rem',height:'23.25rem',background:'#fff',border:'1px solid #dce4f3',borderRadius:18,padding:18,overflowY:'auto',boxShadow:'0 4px 20px #0001',fontSize:12}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
   <div><div style={{color:'#8190ac',fontSize:10,letterSpacing:2}}>RAINY CONTROL / WOB PROTOCOL</div><h2 style={{fontSize:20,fontWeight:700}}>Rainy75 · 主层改键</h2></div>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    <button disabled={busy} onClick={()=>void read()} style={{background:'#6688e8',color:'white',border:0,borderRadius:8,padding:'9px 16px',cursor:'pointer'}}>{busy?'正在读取…':'连接并读取键盘'}</button>
    <button disabled={!data||busy} onClick={save} style={{border:'1px solid #ccd6eb',borderRadius:8,padding:'9px 12px'}}>原始备份</button>
    <button disabled={!data||busy||changes.length===0} onClick={exportDraft} style={{border:'1px solid #ccd6eb',borderRadius:8,padding:'9px 12px'}}>导出修改草稿 ({changes.length})</button>
   </div>
  </div>
  <p role="status" style={{margin:'10px 0',color:'#687a98'}}>{message}</p>
  <div style={{background:'#fff5e6',color:'#875e16',padding:9,borderRadius:8,marginBottom:10}}>普通键修改使用原厂协议流程，并自动下载原始备份、写入前核对配置、写入后回读。可指派已保存的宏；其他特殊键和 Fn 保留原值。首次硬件验证建议只改一个普通键。</div>
  {data&&draft&&<div style={{display:'grid',gridTemplateColumns:'minmax(0,1.5fr) minmax(230px,1fr)',gap:14}}>
   <div style={{minWidth:0}}>
    {rows.map(row=><div key={row.title} style={{marginBottom:8}}><div style={{fontWeight:700,color:'#8290a7',marginBottom:4}}>{row.title}</div><div style={{display:'flex',flexWrap:'wrap',gap:4}}>{row.ids.map(i=>{
     const usage=ordinaryUsage(draft,i);const ordinary=usage!==null;const macro=draft[i*3]===0x70||draft[i*3]===0x71;
     return <button key={i} onClick={()=>{setSelected(i);setNewKey(usage??(macro?256+draft[i*3+1]:0));}} title={'配置索引 #'+i+' · '+hex(draft.slice(i*3,i*3+3))}
      style={{minWidth:39,padding:'7px 5px',borderRadius:7,border:selected===i?'2px solid #6388e6':'1px solid #dce4f3',background:changes.includes(i)?'#fff0ce':'#f4f7fc',fontWeight:selected===i?700:400,cursor:'pointer'}}>
      {ordinary?keyName(usage!):macro?'宏 '+(draft[i*3+1]+1):'#'+i+' *'}<div style={{fontSize:9,color:'#94a0b5'}}>#{i}</div></button>;
    })}</div></div>)}
   </div>
   <div style={{background:'#f5f7fc',padding:12,borderRadius:12,alignSelf:'start'}}>
    <h3 style={{fontWeight:700,fontSize:14}}>当前选中 · 索引 #{selected}</h3>
    <p style={{margin:'8px 0'}}>原始：<code>{hex(data.slice(selected*3,selected*3+3))}</code></p>
    <p style={{margin:'8px 0'}}>预览：<code>{hex(draft.slice(selected*3,selected*3+3))}</code></p>
    <p style={{fontSize:10,color:'#7887a0'}}>布局顺序依据原厂 Rainy75 模块；特殊键暂不编辑。</p>
    <label htmlFor="rainy-key-target" style={{display:'block',marginTop:10,fontWeight:700}}>目标键码</label>
    <select id="rainy-key-target" value={newKey} onChange={e=>setNewKey(Number(e.target.value))} style={{width:'100%',padding:8,borderRadius:7,margin:'6px 0'}}>
     {newKey<256&&!editableKeys.some(k=>k.code===newKey)&&<option value={newKey}>{keyName(newKey)} ({newKey})</option>}
     {Array.from({length:16},(_,i)=><option key={'macro'+i} value={256+i}>宏 {i+1} · 正常停止（需先保存宏）</option>)}
     {editableKeys.map(k=><option key={k.code} value={k.code}>{k.name} · 0x{k.code.toString(16).padStart(2,'0')}</option>)}
    </select>
    <button disabled={busy||!editableSlot(data,selected)} onClick={stage} style={{width:'100%',padding:9,border:0,borderRadius:7,background:'#6688e8',color:'#fff',cursor:'pointer'}}>预览修改（不写入）</button>
    <button disabled={changes.length===0} onClick={resetDraft} style={{width:'100%',padding:8,marginTop:7,border:'1px solid #d2dbea',borderRadius:7}}>撤销所有预览修改</button>
    <button disabled={busy||changes.length===0} onClick={()=>void apply()} style={{width:'100%',padding:9,marginTop:10,border:0,borderRadius:7,background:'#3a765b',color:'#fff'}}>写入键盘并回读验证 ({changes.length})</button>
   </div>
  </div>}
 </section>;
}
