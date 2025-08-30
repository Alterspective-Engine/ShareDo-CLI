export function isEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isBase64(str: string): boolean {
  const base64Regex = /^[A-Za-z0-9+/]*(=|==)?$/;
  if (!base64Regex.test(str)) {
    return false;
  }
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
}

export function isJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

export function isArray<T = any>(value: any): value is T[] {
  return Array.isArray(value);
}

export function isFunction(value: any): value is ((...args: any[]) => any) {
  return typeof value === 'function';
}

export function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isPromise<T = any>(value: any): value is Promise<T> {
  return value instanceof Promise || (
    value !== null &&
    typeof value === 'object' &&
    typeof value.then === 'function' &&
    typeof value.catch === 'function'
  );
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}

export function validateRequired<T>(value: T | undefined | null, fieldName: string): T {
  if (isNullOrUndefined(value)) {
    throw new Error(`${fieldName} is required`);
  }
  return value;
}

export function validateRange(value: number, min: number, max: number, fieldName: string): number {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return value;
}

export function validateLength(value: string, min: number, max: number, fieldName: string): string {
  if (value.length < min || value.length > max) {
    throw new Error(`${fieldName} length must be between ${min} and ${max} characters`);
  }
  return value;
}

export function validatePattern(value: string, pattern: RegExp, fieldName: string): string {
  if (!pattern.test(value)) {
    throw new Error(`${fieldName} format is invalid`);
  }
  return value;
}

export function validateEnum<T>(value: T, validValues: T[], fieldName: string): T {
  if (!validValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${validValues.join(', ')}`);
  }
  return value;
}