/**
 * Icon Manager for ShareDo VS Code Extension
 *
 * Handles downloading, resolving, and managing SVG icons for tree nodes and UI elements.
 * Supports multiple icon sources (FontAwesome, Material Icons, etc.) and local caching.
 */
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { Inform } from './inform';
import { getIconPaths } from './iconResolver';

/**
 * Attempts to download a colored FontAwesome SVG icon at runtime if not present locally.
 * Logs errors to the output channel if download fails.
 */


/**
 * Tries to download an SVG icon from multiple sources (FontAwesome, Material Icons, SimpleIcons, RemixIcon, etc).
 * Returns true if successful, false otherwise. Logs errors for each failed attempt.
 */
export async function tryDownloadIconMultiSource(iconName: string, iconPath: string, onDownloaded?: () => void): Promise<boolean> {
  const sources = [
    // FontAwesome (various)
    `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/svgs/solid/${iconName}.svg`,
    `https://unpkg.com/@fortawesome/fontawesome-free@6.5.2/svgs/solid/${iconName}.svg`,
    `https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/solid/${iconName}.svg`,
    // Material Icons (various)
    `https://cdn.jsdelivr.net/npm/@material-design-icons/svg@1.0.10/svg/filled/${iconName}.svg`,
    `https://cdn.jsdelivr.net/npm/@material-design-icons/svg@1.0.10/svg/outlined/${iconName}.svg`,
    `https://cdn.jsdelivr.net/npm/@material-design-icons/svg@1.0.10/svg/round/${iconName}.svg`,
    `https://cdn.jsdelivr.net/npm/@material-design-icons/svg@1.0.10/svg/sharp/${iconName}.svg`,
    `https://cdn.jsdelivr.net/npm/@material-design-icons/svg@1.0.10/svg/twotone/${iconName}.svg`,
    `https://unpkg.com/@material-design-icons/svg@1.0.10/svg/filled/${iconName}.svg`,
    `https://unpkg.com/@material-design-icons/svg@1.0.10/svg/outlined/${iconName}.svg`,
    `https://unpkg.com/@material-design-icons/svg@1.0.10/svg/round/${iconName}.svg`,
    `https://unpkg.com/@material-design-icons/svg@1.0.10/svg/sharp/${iconName}.svg`,
    `https://unpkg.com/@material-design-icons/svg@1.0.10/svg/twotone/${iconName}.svg`,
    // SimpleIcons (for brands, dev, etc)
    `https://cdn.simpleicons.org/${iconName}`,
    // RemixIcon (system, dev, business, etc)
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/System/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Development/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Business/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Device/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Design/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Communication/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Document/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Editor/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Finance/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Health/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Map/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Media/${iconName}.svg`,
    `https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/icons/Weather/${iconName}.svg`,
  ];
  for (const url of sources) {
    const success = await new Promise<boolean>((resolve) => {
      https.get(url, (res: any) => {
        if (res.statusCode !== 200) {
          resolve(false);
          return;
        }
        let data = '';
        res.on('data', (chunk: any) => { data += chunk; });
        res.on('end', () => {
          try {
            fs.mkdirSync(path.dirname(iconPath), { recursive: true });
            fs.writeFileSync(iconPath, data, 'utf8');
            Inform.writeInfo(`Downloaded icon '${iconName}' from ${url} → file://${iconPath}`);
            if (onDownloaded) {
              onDownloaded();
            }
            resolve(true);
          } catch (e: any) {
            resolve(false);
          }
        });
      }).on('error', (err: any) => {
        resolve(false);
      });
    });
    if (success) {
      return true;
    }
  }
  return false;
}

/**
 * Resolves the icon path for a tree node, supporting custom FontAwesome icons and fallback logic.
 * Returns either a string (for colored SVG) or an object with light/dark paths.
 */
export function resolveTreeNodeIcon(
  type: string,
  icon: string | undefined,
  dynamicType: string | undefined,
  onDownloaded?: () => void
): string | { light: string, dark: string } {
  // Always use colorfulIcons if available
  const workspaceRoot = __dirname.split('sharedo-vscode-extension')[0] + 'sharedo-vscode-extension';
  const iconBase = (icon && icon.replace(/^fa-/, '').replace('-o', '')) || type || 'cube';
  const colorfulLight = path.join(workspaceRoot, 'resources', 'colorfulIcons', `${iconBase}_light.svg`);
  const colorfulDark = path.join(workspaceRoot, 'resources', 'colorfulIcons', `${iconBase}_dark.svg`);
  if (fs.existsSync(colorfulLight) && fs.existsSync(colorfulDark)) {
    return { light: colorfulLight, dark: colorfulDark };
  } else if (fs.existsSync(colorfulLight)) {
    return colorfulLight;
  }
  // Optionally: fallback to fontAwesome for fa- icons
  if (icon && icon.startsWith('fa-')) {
    const iconName = icon.replace('fa-', '').replace('-o', '');
    const faColored = path.join(workspaceRoot, 'resources', 'fontAwesome', `${iconName}_colored.svg`);
    if (fs.existsSync(faColored)) {
      return faColored;
    } else {
      tryDownloadIconMultiSource(iconName, faColored, onDownloaded);
    }
    const faLight = path.join(workspaceRoot, 'resources', 'fontAwesome', `${iconName}_light.svg`);
    const faDark = path.join(workspaceRoot, 'resources', 'fontAwesome', `${iconName}_dark.svg`);
    if (fs.existsSync(faLight) && fs.existsSync(faDark)) {
      return { light: faLight, dark: faDark };
    }
  }
  // Default icon logic (fallback to /icons)
  return getIconPaths(type, dynamicType);
}
