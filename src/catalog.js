import { gifts as defaultGifts } from './content.js';

export function mergeGiftCatalog(overrides = []) {
  const catalog = new Map(defaultGifts.map(gift => [gift.id, { ...gift, active: true, deleted: false, persisted: false }]));
  for (const override of overrides) {
    const base = catalog.get(override.id) || {};
    catalog.set(override.id, {
      ...base,
      ...override,
      id: override.id,
      number: Number.isInteger(override.number) ? override.number : (base.number || 999),
      active: override.active !== false,
      deleted: override.deleted === true,
      persisted: true,
    });
  }
  return [...catalog.values()].sort((a, b) => a.number - b.number || a.name.localeCompare(b.name, 'pt-BR'));
}

export function visibleGiftCatalog(overrides = []) {
  return mergeGiftCatalog(overrides).filter(gift => gift.active && !gift.deleted);
}
