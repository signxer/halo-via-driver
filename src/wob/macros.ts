// Ordinary Rainy75 macro format, original utility module 11508 (type 0).
export type MacroAction={delay:number;action:number;key:number};
export type WobMacro=MacroAction[];
const u16=(n:number)=>[n&255,n>>8];
const get16=(data:Uint8Array,offset:number)=>data[offset]+256*data[offset+1];
export function encodeMacros(macros:WobMacro[]){
 if(macros.length>16)throw new Error('最多支持 16 个宏');
 const records=macros.map(actions=>{
  if(actions.length>90)throw new Error('每个宏最多 90 个动作');
  const bytes=[...u16(actions.length),53,0];
  for(const {delay,action,key} of actions){
   if(!Number.isInteger(delay)||delay<0||delay>65535||!Number.isInteger(action)||action<0||action>255||!Number.isInteger(key)||key<0||key>255)throw new Error('宏字段超出有效范围');
   bytes.push(...u16(delay),action,key);
  }
  return bytes;
 });
 let offset=16+2*macros.length;const offsets=[];
 for(const record of records){offsets.push(...u16(offset));offset+=record.length;}
 return new Uint8Array([170,85,...u16(offset),...u16(macros.length),...Array(10).fill(0),...offsets,...records.flat()]);
}
export function decodeMacros(data:Uint8Array):WobMacro[]{
 if(data.length<16||data[0]!==170||data[1]!==85)throw new Error('无法识别宏文件头');
 const total=get16(data,2),count=get16(data,4);
 if(total>data.length||count>16||16+count*2>total)throw new Error('宏文件长度无效');
 const result:WobMacro[]=[];
 for(let i=0;i<count;i++){
  const start=get16(data,16+i*2),end=i+1<count?get16(data,18+i*2):total;
  if(start<16+count*2||end<start+4||end>total)throw new Error('宏偏移无效');
  const actionCount=get16(data,start);
  if(actionCount>90||start+4+actionCount*4>end)throw new Error('宏动作长度无效');
  result.push(Array.from({length:actionCount},(_,j)=>{const p=start+4+j*4;return {delay:get16(data,p),action:data[p+2],key:data[p+3]};}));
 }
 return result;
}
