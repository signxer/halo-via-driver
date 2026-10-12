import test from 'node:test';
import assert from 'node:assert/strict';
import {readPacket,extractChunk,PHYSICAL_SLOTS,ordinaryUsage,editOrdinaryKey,keymapWriteSequence} from '../src/wob/protocol.ts';
import {readKeymap,writeKeymap,exchange,withDevice} from '../src/wob/transport.ts';
class FakeDevice extends EventTarget {
  opened=true;reports=[];data=Uint8Array.from({length:384},(_,i)=>i%3===0?32:i%3===1?0:(Math.floor(i/3)+4)%256);
  async sendReport(reportId,bytes){
    assert.equal(reportId,4);assert.equal(bytes.length,63);this.reports.push(bytes.slice());
    const response=bytes.slice();
    if(bytes[2]===8)response.set(this.data.slice(bytes[4]+256*bytes[5],bytes[4]+256*bytes[5]+bytes[3]),7);
    if(bytes[2]===9)this.data.set(bytes.slice(7,7+bytes[3]),bytes[4]+256*bytes[5]);
    // Exercise DataView byteOffset handling, not just backing buffer zero.
    const backing=new Uint8Array(70);backing.set(response,4);
    queueMicrotask(()=>{
      const unrelated=new Event('inputreport');Object.assign(unrelated,{device:this,reportId:1,data:new DataView(backing.buffer,4,63)});this.dispatchEvent(unrelated);
      const e=new Event('inputreport');Object.assign(e,{device:this,reportId:4,data:new DataView(backing.buffer,4,63)});this.dispatchEvent(e);
    });
  }
}
test('read request bytes match original Rainy75 AllDataCom fixtures',()=>{
 const fixtures=[[64,0,8,56,0,0,0],[120,0,8,56,56,0,0],[176,0,8,56,112,0,0],[232,0,8,56,168,0,0],[32,1,8,56,224,0,0],[89,0,8,56,24,1,0],[137,0,8,48,80,1,0]];
 fixtures.forEach((f,i)=>assert.deepEqual([...readPacket(8,i*56,i===6?48:56).slice(0,7)],f));
});
test('response payload begins at byte 7, including all 56 bytes',()=>{
 const req=readPacket(8,56,56);const response=req.slice();response.set(Array.from({length:56},(_,i)=>i+1),7);
 assert.deepEqual([...extractChunk(response,req)],Array.from({length:56},(_,i)=>i+1));
 assert.throws(()=>extractChunk(response.slice(0,62),req));
});
test('physical layout has 81 keys and original Enter relocation',()=>{
 assert.equal(PHYSICAL_SLOTS.length,81);assert.equal(new Set(PHYSICAL_SLOTS).size,81);assert.equal(PHYSICAL_SLOTS[44],62);
 const data=new FakeDevice().data;assert.equal(ordinaryUsage(data,48),52);
 const edited=editOrdinaryKey(data,48,41);assert.equal(edited[146],41);assert.equal(edited[144],32);
 assert.throws(()=>editOrdinaryKey(data,15,41));data[144]=0xa0;assert.throws(()=>editOrdinaryKey(data,48,41));
});
test('complete write uses begin, select, keymap, auxiliary and end',()=>{
 const requests=keymapWriteSequence(new FakeDevice().data);
 assert.deepEqual(requests.map(r=>r[2]),[1,3,...Array(7).fill(9),...Array(7).fill(39),2]);
 assert.equal(requests[8][3],48);
 for(const r of requests)assert.equal(r[0]+256*r[1],r.slice(2).reduce((a,b)=>a+b,0));
});
test('read, conflict prevention, hardware writes and readback preserve unedited bytes',async()=>{
 const d=new FakeDevice();const original=await readKeymap(d);assert.deepEqual(original,d.data);
 const draft=editOrdinaryKey(original,48,41);assert.deepEqual(await writeKeymap(d,original,draft),draft);
 await assert.rejects(writeKeymap(d,original,draft),/已改变/);
 const invalid=draft.slice();invalid[0]=0;await assert.rejects(writeKeymap(d,draft,invalid),/目标键编码/);
});
test('queue recovers after failure and timeouts do not resend writes',async()=>{
 const d=new FakeDevice();const events=[];
 await assert.rejects(withDevice(d,async()=>{events.push(1);throw Error('failed')}));
 await withDevice(d,async()=>{events.push(2)});assert.deepEqual(events,[1,2]);
 d.sendReport=async()=>{events.push(3)};
 await assert.rejects(exchange(d,readPacket(8,0,56),10),/超时/);assert.deepEqual(events,[1,2,3]);
});

import {encodeMacros,decodeMacros} from '../src/wob/macros.ts';
import {lightingWriteSequence,writePackets} from '../src/wob/protocol.ts';
import fs from 'node:fs';
const originalFixtures=JSON.parse(fs.readFileSync(new URL('./wob-original-fixtures.json',import.meta.url)));
test('lighting and macro reports match independently executed original driver',()=>{
 const light=Uint8Array.from({length:56},(_,i)=>i);
 assert.deepEqual(lightingWriteSequence(light).map(b=>[...b]),originalFixtures.lighting);
 const data=encodeMacros([[{delay:0,action:138,key:4},{delay:50,action:10,key:4}]]);
 const padded=new Uint8Array(56);padded.set(data);
 assert.deepEqual(writePackets(21,padded).map(b=>[...b]),originalFixtures.macros);
});
test('macro codec preserves existing actions and rejects corrupt offsets',()=>{
 const macros=[[{delay:0,action:138,key:4},{delay:65535,action:10,key:4}],[{delay:25,action:137,key:2}],[]];
 const encoded=encodeMacros(macros);assert.deepEqual(decodeMacros(encoded),macros);
 const corrupt=encoded.slice();corrupt[16]=0;assert.throws(()=>decodeMacros(corrupt));
 assert.throws(()=>encodeMacros([[{delay:-1,action:138,key:4}]]));
});

import {editMacroKey} from '../src/wob/protocol.ts';
test('macro assignment and restoring an ordinary key preserve all other slots',async()=>{
 const d=new FakeDevice();const original=await readKeymap(d);
 const assigned=editMacroKey(original,48,2);assert.deepEqual([...assigned.slice(144,147)],[112,2,0]);
 assert.deepEqual(await writeKeymap(d,original,assigned),assigned);
 const restored=editOrdinaryKey(assigned,48,52);assert.deepEqual(restored,original);
});
test('all 17 keymap reports match independently executed original driver',()=>{
 const raw=new Uint8Array(384);
 originalFixtures.keymap.slice(2,9).forEach(r=>raw.set(r.slice(7,7+r[3]),r[4]+256*r[5]));
 assert.deepEqual(keymapWriteSequence(raw).map(b=>[...b]),originalFixtures.keymap);
});
