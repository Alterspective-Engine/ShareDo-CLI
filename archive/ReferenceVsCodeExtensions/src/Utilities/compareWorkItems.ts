
import { SharedoClient } from '../sharedoClient';
import * as fs from 'fs';
import * as path from 'path';

export interface CompareResult {
  server: string;
  workItemName: string;
  differences: any[];
}

// Helper: Deep diff two objects, return only differences
function deepDiff(a: any, b: any, path: string[] = []): any[] {
  const diffs: any[] = [];
  if (typeof a !== typeof b) {
    diffs.push({ path, a, b });
    return diffs;
  }
  if (typeof a !== 'object' || a === null || b === null) {
    if (a !== b) {diffs.push({ path, a, b });}
    return diffs;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    diffs.push(...deepDiff(a[key], b[key], [...path, key]));
  }
  return diffs;
}

// Helper: Fetch workitem by name (and children/aspects/forms)
async function fetchWorkItemByName(client: SharedoClient, name: string): Promise<any | undefined> {
  // Try work types first
  const workTypes = await client.getWorkTypes();
  if (workTypes && workTypes.length) {
    const found = findByName(workTypes, name);
    if (found) {return found;}
  }
  // Try workflows
  const workflows = await client.getWorkflows();
  if (workflows && workflows.rows) {
    const found = findByName(workflows.rows, name);
    if (found) {return found;}
  }
  // Try forms
  const forms = await client.getFormBuilders();
  if (forms && forms.length) {
    const found = findByName(forms, name);
    if (found) {return found;}
  }
  // TODO: Add more types as needed
  return undefined;
}

function findByName(arr: any[], name: string): any | undefined {
  return arr.find(item => (item.name || item.title || item.systemName) === name);
}

/**
 * Compares a workitem (and its children/aspects/forms) between a source server and one or more target servers.
 * Only outputs differences. Saves report to /reports/.
 */
export async function compareWorkItems(
  sourceClient: SharedoClient,
  sourceWorkItemName: string,
  targetClients: { client: SharedoClient }[],
  reportName: string = ''
): Promise<CompareResult[]> {
  // Fetch source workitem
  const source = await fetchWorkItemByName(sourceClient, sourceWorkItemName);
  if (!source) {throw new Error('Source workitem not found');}
  const results: CompareResult[] = [];
  for (const target of targetClients) {
    const targetItem = await fetchWorkItemByName(target.client, sourceWorkItemName);
    if (!targetItem) {
      results.push({ server: target.client.url, workItemName: sourceWorkItemName, differences: [{ error: 'Not found' }] });
      continue;
    }
    // Compare recursively
    const differences = deepDiff(source, targetItem);
    if (differences.length > 0) {
      results.push({ server: target.client.url, workItemName: sourceWorkItemName, differences });
    }
  }
  // Instead of saving, just return results
  return results;
}
