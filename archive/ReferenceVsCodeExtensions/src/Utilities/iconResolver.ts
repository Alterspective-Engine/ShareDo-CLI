import * as path from 'path';
import * as fs from 'fs';

/**
 * Icon Resolver for ShareDo VS Code Extension
 *
 * Maps logical type names to icon base names and resolves the correct icon path for each type.
 * Supports colorful, medium, and light/dark icon variants for flexible UI representation.
 */
const iconMap: Record<string, string> = {
  server: 'server',
  deploytoserver: 'deploy',
  compareserver: 'compare', // Add compare icon mapping
  connectors: 'plug',
  connector: 'plug',
  workflows: 'workflow',
  workflow: 'workflow',
  error: 'error',
  errors: 'error',
  info: 'info',
  infos: 'info',
  favorites: 'star',
  favoriteitem: 'star',
  worktypes: 'briefcase',
  worktype: 'briefcase',
  form: 'form',
  forms: 'form',
  formfield: 'form',
  folder: 'folder',
  folderitem: 'folder',
  object: 'cube',
  ide: 'code',
  css: 'filecode',
  html: 'html',
  js: 'js',
  json: 'json',
  text: 'text',
  widgetmanifest: 'puzzle',
  workflowdefinition: 'workflowdef',
  workflowsteps: 'step',
  workflowstep: 'step',
  optionset: 'options',
  optionsets: 'options',
  worktypecreatepermissions: 'user-lock',
};



/**
 * Helper to get the icon paths for the 'compare' type.
 * @returns {string | {light: string, dark: string}} The icon path(s) for the compare type.
 */
export function getCompareIconPaths() {
  return getIconPaths('compare');
}


/**
 * Normalizes a type string for icon lookup by converting to lowercase and removing non-alphanumeric characters.
 * @param {string} type - The type string to normalize.
 * @returns {string} The normalized type string.
 */
function normalizeType(type: string): string {
  return type ? type.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
}

/**
 * Returns the icon path(s) for a given type, preferring colorful icons, then medium, then light/dark variants.
 *
 * - If a colorful icon exists for the type, returns an object with `light` and `dark` properties.
 * - If a medium icon exists, returns the path to the medium icon (string).
 * - Otherwise, returns an object with `light` and `dark` icon paths from /icons.
 *
 * @param {string} type - The main type (ElementTypes value as string).
 * @param {string} [dynamicType] - Optional dynamic type for fallback lookup.
 * @returns {string | {light: string, dark: string}} The icon path(s) for the type.
 */
export function getIconPaths(type: string, dynamicType?: string): string | { light: string, dark: string } {
  const normType = normalizeType(type);
  const normDynamic = dynamicType ? normalizeType(dynamicType) : undefined;
  let iconBase = iconMap[normType] || (normDynamic && iconMap[normDynamic]) || 'cube';

  // Prefer colorfulIcons if available
  const colorfulLight = path.join(__dirname, '..', '..', 'resources', 'colorfulIcons', `${iconBase}_light.svg`);
  const colorfulDark = path.join(__dirname, '..', '..', 'resources', 'colorfulIcons', `${iconBase}_dark.svg`);
  if (fs.existsSync(colorfulLight) && fs.existsSync(colorfulDark)) {
    return {
      light: colorfulLight,
      dark: colorfulDark
    };
  }

  // Prefer medium icons in /icons if available
  const mediumIcon = path.join(__dirname, '..', '..', 'resources', 'icons', `${iconBase}_medium.svg`);
  if (fs.existsSync(mediumIcon)) {
    return mediumIcon;
  }

  // Fallback to /icons (light/dark)
  return {
    light: path.join(__dirname, '..', '..', 'resources', 'icons', `${iconBase}_light.svg`),
    dark: path.join(__dirname, '..', '..', 'resources', 'icons', `${iconBase}_dark.svg`)
  };
}


/**
 * Registers or overrides an icon mapping for a given type at runtime.
 * @param {string} type - The logical type name to register.
 * @param {string} iconBase - The icon base name (without _light/_dark/_medium).
 */
export function registerIcon(type: string, iconBase: string): void {
  iconMap[type] = iconBase;
}
