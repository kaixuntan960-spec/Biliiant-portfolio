type ComputeFn<K, V> = (key: K) => V;

// Must use globalThis.Map: unplugin-auto-import rewrites bare `Map` to lucide-react's Map icon in .ts/.tsx files.
const NativeMap = globalThis.Map;
if (typeof NativeMap === "function" && NativeMap.prototype) {
  const mapProto = NativeMap.prototype as Map<unknown, unknown> & {
    getOrInsert?: (key: unknown, defaultValue: unknown) => unknown;
    getOrInsertComputed?: (key: unknown, compute: ComputeFn<unknown, unknown>) => unknown;
  };

  if (typeof mapProto.getOrInsert !== "function") {
    Object.defineProperty(NativeMap.prototype, "getOrInsert", {
      configurable: true,
      writable: true,
      value: function getOrInsert<K, V>(this: Map<K, V>, key: K, defaultValue: V) {
        if (this.has(key)) return this.get(key) as V;
        this.set(key, defaultValue);
        return defaultValue;
      },
    });
  }

  if (typeof mapProto.getOrInsertComputed !== "function") {
    Object.defineProperty(NativeMap.prototype, "getOrInsertComputed", {
      configurable: true,
      writable: true,
      value: function getOrInsertComputed<K, V>(this: Map<K, V>, key: K, compute: ComputeFn<K, V>) {
        if (this.has(key)) return this.get(key) as V;
        const value = compute(key);
        this.set(key, value);
        return value;
      },
    });
  }
}

export {};
