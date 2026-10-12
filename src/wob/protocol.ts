// Derived from supplied WOB web driver module 126 (ordinary Rainy75), not RT.
// WebHID payloads exclude report ID 4. Requests/responses have a 7-byte header.
export const KEYMAP_LENGTH = 384;
export const REPORT_ID = 4;
export const CHUNK_SIZE = 56;
export const HIDDEN_SLOTS = [15,31,46,47,60,65,76,79,83,84,85,86,87,89,92];
export const PHYSICAL_SLOTS = (() => {
  const slots = Array.from({length:96},(_,i)=>i).filter(i=>!HIDDEN_SLOTS.includes(i));
  const enter = slots.splice(57,1)[0];
  slots.splice(44,0,enter);
  return slots;
})();
function byte(value:number) {
  if (!Number.isInteger(value) || value < 0 || value > 255) throw new Error('Invalid byte');
  return value;
}
export function packet(command:number, args: readonly number[] = []) {
  if(args.length > 60) throw new Error('Report payload is too large');
  const output = new Uint8Array(63);
  output[2]=byte(command);
  args.forEach((value,index)=>{output[index+3]=byte(value);});
  const sum=output.slice(2).reduce((a,b)=>a+b,0);
  output[0]=sum&255;output[1]=sum>>8;
  return output;
}
export function readPacket(command:number,offset:number,size:number) {
  if(!Number.isInteger(offset)||offset<0||offset>65535||!Number.isInteger(size)||size<1||size>56) throw new Error('Invalid read range');
  return packet(command,[size,offset&255,offset>>8,0]);
}
export function writePackets(command:number,data:Uint8Array) {
  if(data.length>65535)throw new Error('Data is too large');
  const reports:Uint8Array[]=[];
  for(let offset=0;offset<data.length;offset+=56){
    const size=Math.min(56,data.length-offset);
    reports.push(packet(command,[size,offset&255,offset>>8,0,...data.slice(offset,offset+size)]));
  }
  return reports;
}
export function extractChunk(response:Uint8Array,request:Uint8Array) {
  const size=request[3];
  if(response.length<7+size)throw new Error('Incomplete keymap response');
  if(!response.slice(2,7).every((v,i)=>v===request[i+2]))throw new Error('Unexpected keymap response');
  return response.slice(7,7+size);
}
export function ordinaryUsage(data:Uint8Array,slot:number) {
  const start=slot*3;
  return data[start]===0x20 && data[start+1]===0 ? data[start+2] : null;
}
export function editOrdinaryKey(data:Uint8Array,slot:number,usage:number) {
  if(data.length!==384 || !PHYSICAL_SLOTS.includes(slot) || !editableSlot(data,slot))throw new Error('Only ordinary physical keys may be edited');
  byte(usage);const result=data.slice();result.set([0x20,0,usage],slot*3);return result;
}

// Original keyReplace always writes this auxiliary table after command 0x09.
export const AUXILIARY_TABLE = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 0, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 32, 0, 0, 0, 0, 32, 0, 0, 32, 0, 0]);
export function keymapWriteSequence(data:Uint8Array) {
  if(data.length!==384)throw new Error("Expected 384 keymap bytes");
  // Original auxiliary final report declares 48 bytes but carries 56 bytes.
  // Retain its eight trailing bytes and checksum exactly, rather than guessing.
  const auxiliary=[];
  for(let offset=0;offset<384;offset+=56){
    auxiliary.push(packet(39,[Math.min(56,384-offset),offset&255,offset>>8,0,...AUXILIARY_TABLE.slice(offset,offset+56)]));
  }
  return [packet(1),packet(3,[34]),...writePackets(9,data),...auxiliary,packet(2)];
}
export function lightingWriteSequence(data:Uint8Array){
  if(data.length!==56)throw new Error('Expected 56 lighting bytes');
  return [packet(1),packet(6,[39,0,0,0,...data]),packet(2)];
}
export function editableSlot(data:Uint8Array,slot:number){
  const i=slot*3;
  return ordinaryUsage(data,slot)!==null || ((data[i]===0x70||data[i]===0x71)&&data[i+1]<16);
}
export function editMacroKey(data:Uint8Array,slot:number,macro:number){
  if(data.length!==384||!PHYSICAL_SLOTS.includes(slot)||!editableSlot(data,slot)||!Number.isInteger(macro)||macro<0||macro>15)throw new Error('Invalid macro assignment');
  const next=data.slice();next.set([0x70,macro,0],slot*3);return next;
}
