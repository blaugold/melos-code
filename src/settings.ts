import * as vscode from 'vscode'
import { error, info } from './logging'
import { melosWorkspaces } from './melos-workspace'
import { loadMelosWorkspaceConfig } from './workspace-config'

/**
 * Ensure that Melos workspaces have default VS Code settings.
 */
export async function registerDefaultMelosWorkspaceSettings(
  context: vscode.ExtensionContext
) {
  await Promise.all(
    melosWorkspaces.workspaceFolders.map((folder) =>
      applyDefaultMelosWorkspaceSettings(context, folder)
    )
  )

  context.subscriptions.push(
    melosWorkspaces.onDidChangeWorkspaceFolders(async (event) => {
      for (const folder of event.added) {
        try {
          await applyDefaultMelosWorkspaceSettings(context, folder)
        } catch (e) {
          error(
            `Failed to apply default Melos workspace settings in '${folder.name}' folder`,
            e
          )
        }
      }
    })
  )
}

/**
 * The default VS Code settings to apply to a Melos workspace.
 */
const melosWorkspaceDefaultSettings: {
  'dart.runPubGetOnPubspecChanges'?: string
} = {
  'dart.runPubGetOnPubspecChanges': 'never',
}

async function applyDefaultMelosWorkspaceSettings(
  context: vscode.ExtensionContext,
  folder: vscode.WorkspaceFolder
) {
  const defaultSettings = { ...melosWorkspaceDefaultSettings }

  const melosConfig = await loadMelosWorkspaceConfig(context, folder)
  if (melosConfig?.command?.bootstrap?.usePubspecOverrides === true) {
    delete defaultSettings['dart.runPubGetOnPubspecChanges']
  }

  if (Object.keys(defaultSettings).length === 0) {
    return
  }

  const settings = vscode.workspace.getConfiguration(undefined, folder)

  for (const [key, value] of Object.entries(melosWorkspaceDefaultSettings)) {
    const { workspaceFolderValue } = settings.inspect(key)!

    if (workspaceFolderValue !== undefined) {
      // Either the user or the extension has already configured this setting.
      info(
        `Found that '${key}' is set to '${workspaceFolderValue}' in '${folder.name}' folder`
      )
      continue
    }

    info(`Setting '${key}' to '${value}' in '${folder.name}' folder`)

    await settings.update(
      key,
      value,
      vscode.ConfigurationTarget.WorkspaceFolder
    )
  }
}
