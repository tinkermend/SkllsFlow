/**
 * BigInt 序列化工具
 * 用于将包含 BigInt 的对象转换为可 JSON 序列化的格式
 */

/**
 * 将对象中的所有 BigInt 转换为字符串
 * 支持嵌套对象和数组，保留 Date 对象
 *
 * @param obj - 需要序列化的对象
 * @returns 序列化后的对象（BigInt 转换为 string，Date 保持不变）
 *
 * @example
 * ```typescript
 * const data = { id: 123n, name: "test", createdAt: new Date(), nested: { count: 456n } };
 * const serialized = serializeBigInt(data);
 * // { id: "123", name: "test", createdAt: Date, nested: { count: "456" } }
 * ```
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return String(obj) as T;
  }

  // 保留 Date 对象不做处理
  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt) as T;
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeBigInt(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

/**
 * 批量序列化数组中的对象
 *
 * @param items - 需要序列化的对象数组
 * @returns 序列化后的对象数组
 *
 * @example
 * ```typescript
 * const items = [
 *   { id: 1n, name: "item1" },
 *   { id: 2n, name: "item2" }
 * ];
 * const serialized = serializeBigIntArray(items);
 * // [{ id: "1", name: "item1" }, { id: "2", name: "item2" }]
 * ```
 */
export function serializeBigIntArray<T>(items: T[]): T[] {
  return items.map(item => serializeBigInt(item));
}

/**
 * 全局 BigInt.prototype.toJSON 补丁
 * 使 JSON.stringify 自动处理 BigInt
 *
 * 注意：这会修改全局 BigInt 原型，建议在应用启动时调用一次
 *
 * @example
 * ```typescript
 * // 在 server/index.ts 中调用
 * enableBigIntSerialization();
 *
 * // 之后所有的 JSON.stringify 都会自动处理 BigInt
 * JSON.stringify({ id: 123n }); // '{"id":"123"}'
 * ```
 */
export function enableBigIntSerialization() {
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}
