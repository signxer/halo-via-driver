// 从 VIA 定义 JSON 的 menus 提取灯效配置(数据驱动,支持任意型号)
// menus → [ {label:'Lighting', content:[ {label:'Backlight', content:[ items ]} ]} ]
// item.content = ["id_qmk_rgb_matrix_xxx", channel, command]

import type {Definition, Menu, MenuContentItem} from '../types/definition';

export type LightingItem = {
  id: string;
  label: string;
  type: 'range' | 'dropdown' | 'color' | 'text' | 'button';
  options?: string[];
  channel: number;
  command: number;
  showIf?: string;
};

export type LightingZone = {
  label: string;
  items: LightingItem[];
};

const toItem = (raw: MenuContentItem): LightingItem | null => {
  const content = raw.content as unknown[] | undefined;
  if (!Array.isArray(content) || content.length < 2) return null;
  const [id, channel, command] = content as [string, number, number];
  return {
    id: String(id),
    label: raw.label,
    type: (raw.type ?? 'text') as LightingItem['type'],
    options: raw.options?.map(String),
    channel: Number(channel),
    command: Number(command),
    showIf: raw.showIf,
  };
};

export function parseLightingMenus(definition: Definition | null): LightingZone[] {
  if (!definition?.menus) return [];
  const lighting = definition.menus.find((m: Menu) => m.label === 'Lighting');
  if (!lighting) return [];
  const zones: LightingZone[] = [];
  for (const zone of lighting.content) {
    if ('content' in zone && Array.isArray(zone.content)) {
      const items = zone.content
        .map((it) => toItem(it as MenuContentItem))
        .filter((x): x is LightingItem => !!x);
      if (items.length) zones.push({label: zone.label, items});
    }
  }
  return zones;
}

// 取某区域中的指定类型项
export function findItem(
  zone: LightingZone,
  type: LightingItem['type'],
  labelPart?: string,
): LightingItem | undefined {
  return zone.items.find(
    (i) => i.type === type && (!labelPart || i.label.includes(labelPart)),
  );
}
