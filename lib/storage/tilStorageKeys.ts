const LEGACY_KEYS = {
  selectedPairs: "til_v8_selected_pairs",
  alertedDaily: "til_v8_alerted_daily",
} as const;

export const TIL_STORAGE_KEYS = {
  selectedPairs: "til_v9_selected_pairs",
  alertedDaily: "til_v9_alerted_daily",
} as const;

type TilStorageKey = keyof typeof TIL_STORAGE_KEYS;

/** Read a TIL localStorage value, migrating legacy V8 keys when present. */
export function readTilStorageItem(key: TilStorageKey): string | null {
  if (typeof window === "undefined") return null;
  const current = localStorage.getItem(TIL_STORAGE_KEYS[key]);
  if (current !== null) return current;
  const legacy = localStorage.getItem(LEGACY_KEYS[key]);
  if (legacy === null) return null;
  localStorage.setItem(TIL_STORAGE_KEYS[key], legacy);
  localStorage.removeItem(LEGACY_KEYS[key]);
  return legacy;
}

export function writeTilStorageItem(key: TilStorageKey, value: string) {
  localStorage.setItem(TIL_STORAGE_KEYS[key], value);
}
