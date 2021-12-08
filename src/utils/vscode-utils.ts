import * as vscode from 'vscode'
import { debug } from '../logging'

/**
 * Type guard to check whether the given value is a {@link vscode.WorkspaceFolder}.
 */
export function isWorkspaceFolder(value: any): value is vscode.WorkspaceFolder {
  return (
    typeof value === 'object' &&
    'uri' in value &&
    'name' in value &&
    'index' in value
  )
}

/**
 * Returns whether the given {@link folder} is currently an open workspace folder.
 */
export function isOpenWorkspaceFolder(folder: vscode.WorkspaceFolder): boolean {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    return false
  }
  return workspaceFolders.includes(folder)
}

/**
 * Resolves a single {@link vscode.WorkspaceFolder}.
 *
 * If there are no open workspace folders, `undefined` is returned.
 *
 * If there is one open workspace folder, it is returned.
 *
 * If there are multiple open workspace folders, the users is asked to select one.
 */
export async function resolveWorkspaceFolder() {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    debug(`Could not resolve workspace folder: no workspace folders are open.`)
    return
  }

  if (workspaceFolders.length === 1) {
    return workspaceFolders[0]
  }

  const selectedWorkspace = await vscode.window.showWorkspaceFolderPick()
  if (!selectedWorkspace) {
    debug(`Could not resolve workspace folder: user did not select one.`)
  }

  return selectedWorkspace
}
