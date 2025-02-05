/**
 * Utility to validate an array of objects based on key type requirements.
 * @param items The array to validate
 * @param schema A schema defining expected key types
 * @returns A boolean indicating validity
 */
export function validateItemArrayObjects(
    items: any[],
    schema: Record<string, 'string' | 'number' | 'boolean'>
  ): boolean {
    if (!Array.isArray(items)) return false;
  
    return items.every((obj) => {
      if (typeof obj !== 'object' || obj === null) return false;
  
      return Object.entries(schema).every(([key, type]) => 
        key in obj && typeof obj[key] === type &&
        (type !== 'number' || Number.isFinite(obj[key]))
      );
    });
  }