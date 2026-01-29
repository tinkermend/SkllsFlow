/**
 * Recursively convert Prisma results so that BigInt fields become strings.
 * Prevents JSON serialization errors when returning data from the API layer.
 */
export function serializePrisma<T>(value: T): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializePrisma(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    const serialized: Record<string, any> = {};
    for (const [key, entry] of Object.entries(value as Record<string, any>)) {
      serialized[key] = serializePrisma(entry);
    }
    return serialized;
  }

  return value;
}
