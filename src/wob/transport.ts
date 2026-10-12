import {CHUNK_SIZE, KEYMAP_LENGTH, REPORT_ID, extractChunk, keymapWriteSequence, readPacket, packet, lightingWriteSequence, writePackets, editableSlot, PHYSICAL_SLOTS} from './protocol.ts';
// Serialize operations per device. A failed request must not poison the queue.
const queues=new WeakMap<HIDDevice,Promise<unknown>>();
export function withDevice<T>(device:HIDDevice,operation:()=>Promise<T>):Promise<T>{
  const next=(queues.get(device)??Promise.resolve()).catch(()=>{}).then(operation);
  queues.set(device,next);return next;
}
export function exchange(device:HIDDevice,request:Uint8Array,timeout=2500):Promise<Uint8Array>{
  if(!device.opened)return Promise.reject(new Error('键盘未连接'));
  return new Promise((resolve,reject)=>{
    let done=false;
    const clean=()=>{clearTimeout(timer);device.removeEventListener('inputreport',handler);};
    const fail=(error:unknown)=>{if(done)return;done=true;clean();reject(error);};
    const handler=(event:HIDInputReportEvent)=>{
      if(event.device!==device||event.reportId!==REPORT_ID)return;
      const data=new Uint8Array(event.data.buffer,event.data.byteOffset,event.data.byteLength);
      if(data.length<3||data[2]!==request[2])return;
      if([8,20].includes(request[2]) && (data.length<7||!data.slice(3,7).every((v,i)=>v===request[i+3])))return;
      if(done)return;done=true;clean();resolve(data.slice());
    };
    const timer=setTimeout(()=>fail(new Error(`命令 0x${request[2].toString(16)} 响应超时`)),timeout);
    device.addEventListener('inputreport',handler);
    device.sendReport(REPORT_ID,new Uint8Array(request)).catch(fail);
  });
}
async function readUnlocked(device:HIDDevice){
  await exchange(device,packet(1));
  await exchange(device,packet(3,[34]));
  const output=new Uint8Array(KEYMAP_LENGTH);
  for(let offset=0;offset<KEYMAP_LENGTH;offset+=CHUNK_SIZE){
    const request=readPacket(8,offset,Math.min(CHUNK_SIZE,KEYMAP_LENGTH-offset));
    output.set(extractChunk(await exchange(device,request),request),offset);
  }
  await exchange(device,packet(2));
  return output;
}
export function readKeymap(device:HIDDevice){return withDevice(device,()=>readUnlocked(device));}
export function writeKeymap(device:HIDDevice,original:Uint8Array,draft:Uint8Array){
  if(original.length!==384||draft.length!==384)return Promise.reject(new Error('键位备份长度不正确'));
  for(let slot=0;slot<128;slot++){
    const start=slot*3;
    if(original.slice(start,start+3).every((v,i)=>v===draft[start+i]))continue;
    if(!PHYSICAL_SLOTS.includes(slot)||!editableSlot(original,slot))return Promise.reject(new Error('禁止修改特殊键或保留字段'));
    const ordinary=draft[start]===0x20&&draft[start+1]===0;
    const macro=draft[start]===0x70&&draft[start+1]<16&&draft[start+2]===0;
    if(!ordinary&&!macro)return Promise.reject(new Error('不支持的目标键编码'));
  }
  return withDevice(device,async()=>{
    const current=await readUnlocked(device);
    if(!current.every((v,i)=>v===original[i]))throw new Error('键盘配置已改变，请重新读取后再编辑');
    // No retries on writes: an ambiguous response must be investigated first.
    for(const request of keymapWriteSequence(draft))await exchange(device,request);
    const actual=await readUnlocked(device);
    if(!actual.every((v,i)=>v===draft[i]))throw new Error('写入后回读不一致，请保留备份并重新读取；配置可能已部分改变');
    return actual;
  });
}

export function readLighting(device:HIDDevice){
  return withDevice(device,async()=>{
    const response=await exchange(device,packet(5,[39]));
    if(response.length<63||response[3]!==39)throw new Error('灯光配置响应不完整');
    return response.slice(7,63);
  });
}
export function updateLighting(device:HIDDevice,mode:number,rgb:[number,number,number],brightness:number,speed:number){
  return withDevice(device,async()=>{
    const response=await exchange(device,packet(5,[39]));
    if(response.length<63||response[3]!==39)throw new Error('灯光配置响应不完整');
    const data=response.slice(7,63);
    data[1]=mode;data[2]=brightness;data[3]=speed;data[5]=0;data.set(rgb,6);
    const commands=lightingWriteSequence(data);
    for(const command of commands)await exchange(device,command);
    const actual=await exchange(device,packet(5,[39]));
    if(actual.length<63||actual[3]!==39||![1,2,3,5,6,7,8].every(i=>actual[7+i]===data[i]))throw new Error('灯光设置已发送，但回读未匹配，请检查实际灯效');
    return commands;
  });
}

async function readMacroUnlocked(device:HIDDevice){
  const firstRequest=readPacket(20,0,56);
  const first=extractChunk(await exchange(device,firstRequest),firstRequest);
  if(first[0]===0&&first[1]===0)return new Uint8Array();
  if(first[0]!==170||first[1]!==85)throw new Error('无法识别键盘宏文件头');
  const length=first[2]+256*first[3];
  if(length<16||length>8192)throw new Error('宏存储长度异常');
  const output=new Uint8Array(Math.ceil(length/56)*56);output.set(first);
  for(let offset=56;offset<length;offset+=56){
    const request=readPacket(20,offset,56);
    output.set(extractChunk(await exchange(device,request),request),offset);
  }
  return output.slice(0,length);
}
export function readMacros(device:HIDDevice){return withDevice(device,()=>readMacroUnlocked(device));}
export function writeMacros(device:HIDDevice,original:Uint8Array,data:Uint8Array){
  return withDevice(device,async()=>{
    const current=await readMacroUnlocked(device);
    if(current.length!==original.length||!current.every((v,i)=>v===original[i]))throw new Error('宏配置已改变，请重新读取');
    // Original macro writer always sends 56-byte blocks, zero-padding the last.
    const padded=new Uint8Array(Math.ceil(data.length/56)*56);padded.set(data);
    for(const request of writePackets(21,padded))await exchange(device,request);
    const actual=await readMacroUnlocked(device);
    if(actual.length!==data.length||!actual.every((v,i)=>v===data[i]))throw new Error('宏写入回读不一致，配置可能已改变');
    return actual;
  });
}
