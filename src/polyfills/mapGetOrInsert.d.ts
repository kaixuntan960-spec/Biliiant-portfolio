/** Merges optional helpers onto built-in Map (runtime patched in mapGetOrInsert.ts). */
interface Map<K, V> {
  getOrInsert?(key: K, defaultValue: V): V;
  getOrInsertComputed?(key: K, compute: (key: K) => V): V;
}
