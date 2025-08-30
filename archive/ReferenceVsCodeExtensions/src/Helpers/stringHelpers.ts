/**
 * String Helper Utilities for ShareDo VS Code Extension
 *
 * Provides utility functions for string manipulation, such as reading file contents and removing UTF-8 BOM.
 */
import * as fs from 'fs/promises';


// Exported function to remove utf-8 BOM from file contents


export async function getStringContentsFromfileUri(filePath: string): Promise<string> {
    //write code to read the file contents

    return fs.readFile(filePath, 'utf8').then((data) => {
        return removeUTF8BOM(data);
    }).catch((err) => {
        console.log(`[ERROR] [stringHelpers::getStringContentsFromfileUri] Failed to read file: ${filePath}`, err);
        return Promise.reject(new Error(`Failed to read file '${filePath}': ${err.message}`));
    });

}


export function removeUTF8BOM(content: string) {
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.substring(1);
    }
    return content;
}
