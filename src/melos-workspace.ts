import * as vscode from 'vscode'
import { debug, info } from './logging'
import { fileExists } from './utils/fs-utils'
import { isOpenWorkspaceFolder } from './utils/vscode-utils'
import { melosYamlFile } from './workspace-config'

/**
 * API for the currently opened Melos workspaces.
 */
export interface MelosWorkspaces {
  /**
   * List of workspace folders that are open that are Melos workspaces.
   */
  get workspaceFolders(): vscode.WorkspaceFolder[]

  /**
   * An event that is emitted when a workspace folder is added or removed that
   * is a Melos workspace.
   */
  onDidChangeWorkspaceFolders: vscode.Event<vscode.WorkspaceFoldersChangeEvent>
}

export const melosWorkspaces: MelosWorkspaces = {
  get workspaceFolders() {
    return workspaceFolders
  },

  get onDidChangeWorkspaceFolders() {
    return onDidChangeWorkspaceFoldersEmitter.event
  },
}

export async function initMelosWorkspaces(context: vscode.ExtensionContext) {
  workspaceFolders.push(...(await getMelosWorkspaceFolders()))

  context.subscriptions.push(onDidChangeWorkspaceFoldersEmitter)

  // Watch the workspace folder for changes.
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
      for (const folder of event.added) {
        if (await isMelosWorkspace(folder)) {
          if (isOpenWorkspaceFolder(folder)) {
            addMelosWorkspace(folder)
          }
        }
      }

      for (const folder of event.removed) {
        removeMelosWorkspace(folder)
      }
    })
  )

  // Watch melos.yml files for changes.
  const melosYamlWatcher = vscode.workspace.createFileSystemWatcher(
    `**/${melosYamlFile}`,
    false,
    true,
    false
  )
  context.subscriptions.push(melosYamlWatcher)

  context.subscriptions.push(
    melosYamlWatcher.onDidCreate(async (uri) => {
      debug(`onDidCreate: ${uri}`)

      const folder = vscode.workspace.getWorkspaceFolder(uri)
      if (folder) {
        addMelosWorkspace(folder)
      }
    })
  )

  context.subscriptions.push(
    melosYamlWatcher.onDidDelete(async (uri) => {
      debug(`onDidDelete: ${uri}`)

      const folder = vscode.workspace.getWorkspaceFolder(uri)
      if (folder) {
        removeMelosWorkspace(folder)
      }
    })
  )
}

const workspaceFolders: vscode.WorkspaceFolder[] = []

const onDidChangeWorkspaceFoldersEmitter =
  new vscode.EventEmitter<vscode.WorkspaceFoldersChangeEvent>()

function addMelosWorkspace(folder: vscode.WorkspaceFolder) {
  if (workspaceFolders.includes(folder)) {
    return
  }

  workspaceFolders.push(folder)
  info(`Added Melos workspace: ${folder.name}`)

  onDidChangeWorkspaceFoldersEmitter.fire({
    added: [folder],
    removed: [],
  })
}

function removeMelosWorkspace(folder: vscode.WorkspaceFolder) {
  const index = workspaceFolders.indexOf(folder)
  if (index === -1) {
    return
  }

  workspaceFolders.splice(index, 1)
  info(`Removed Melos workspace: ${folder.name}`)

  onDidChangeWorkspaceFoldersEmitter.fire({
    added: [],
    removed: [folder],
  })
}

export async function isMelosWorkspace(folder: vscode.WorkspaceFolder) {
  return fileExists(vscode.Uri.joinPath(folder.uri, melosYamlFile))
}

async function getMelosWorkspaceFolders() {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders) {
    return []
  }

  const result: vscode.WorkspaceFolder[] = []
  for (const folder of workspaceFolders) {
    if (await isMelosWorkspace(folder)) {
      addMelosWorkspace(folder)
    }
  }
  return result
}
