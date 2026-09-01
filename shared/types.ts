interface CacheEntry {
  text: string,
  frequency: number,
}

export interface CacheSnapshot {
  capacity: number,
  activePolicy: "lru" | "lfu",
  entries: CacheEntry[],
}