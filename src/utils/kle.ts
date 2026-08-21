// KLE (Keyboard Layout Editor) 格式解析
// 把 VIA JSON 的 layouts.keymap 数组转换为带绝对坐标的键列表

import type {KLEKey} from '../types/definition';

type KLEItem = string | {w?: number; h?: number; x?: number; y?: number; d?: boolean};

/**
 * 解析 KLE keymap 数组。
 * KLE/VIA 规则:
 * - 每行从 (x=0, y=rowIndex) 开始
 * - 对象元素 {"w","h","x","y"} 修饰紧随其后的字符串键(或纯占位)
 * - 字符串 "r,c" 是键(matrix 坐标),其 x = 游标位置,w = pending.w
 * - 键消费宽度:游标 += 键宽
 */
export function parseKLE(keymap: KLEItem[][]): KLEKey[] {
  const keys: KLEKey[] = [];

  keymap.forEach((row, rowIdx) => {
    let xCursor = 0;
    let pending: {w: number; h: number; x: number; y: number} = {
      w: 1,
      h: 1,
      x: 0,
      y: 0,
    };

    row.forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        // 元数据对象:设置偏移和下一个键的尺寸
        xCursor += item.x ?? 0;
        pending = {
          w: item.w ?? pending.w,
          h: item.h ?? pending.h,
          x: item.x ?? 0,
          y: item.y ?? 0,
        };
        return;
      }
      if (typeof item === 'string') {
        const [r, c] = item.split(',').map(Number);
        keys.push({
          row: r,
          col: c,
          w: pending.w,
          h: pending.h,
          x: xCursor,
          y: rowIdx + pending.y,
        });
        xCursor += pending.w;
        pending = {w: 1, h: 1, x: 0, y: 0};
      }
    });
  });

  return keys;
}
