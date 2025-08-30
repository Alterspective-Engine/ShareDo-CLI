export function camelCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

export function pascalCase(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
    return word.toUpperCase();
  }).replace(/\s+/g, '');
}

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (str.length <= length) {
    return str;
  }
  return str.slice(0, length - suffix.length) + suffix;
}

export function isNullOrEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

export function isNotNullOrEmpty(str: string | null | undefined): str is string {
  return !isNullOrEmpty(str);
}

export function padLeft(str: string, length: number, char: string = ' '): string {
  return str.padStart(length, char);
}

export function padRight(str: string, length: number, char: string = ' '): string {
  return str.padEnd(length, char);
}

export function toBase64(str: string): string {
  return Buffer.from(str).toString('base64');
}

export function fromBase64(str: string): string {
  return Buffer.from(str, 'base64').toString('utf-8');
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-z0-9_\-.]/gi, '_');
}

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot === -1 ? '' : fileName.substring(lastDot + 1).toLowerCase();
}

export function removeFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot === -1 ? fileName : fileName.substring(0, lastDot);
}