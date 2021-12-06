import * as vscode from 'vscode'
import { createMelosYaml, openMelosYamlInEditor } from '../utils/melos-yaml-utils'
import { retryUntilResult } from '../utils/misc-utils'
import { workspaceFolder } from '../utils/vscode-workspace-utils'

suite('Default settings', () => {
  test('should apply defaults', async () => {
    await createMelosYaml()
    // We need to open the melos.yaml file to activate the extension.
    // Just creating the file does not activate the extension.
    await openMelosYamlInEditor()

    const melosWorkspaceDefaultSettings = {
      'dart.runPubGetOnPubspecChanges': false,
    }

    // Check that all default settings have the correct values.
    // We need to wait until the defaults have been replaced with the correct values
    // in the workspace settings.
    await retryUntilResult(() => {
      const settings = vscode.workspace.getConfiguration(
        undefined,
        workspaceFolder()
      )

      for (const [key, value] of Object.entries(
        melosWorkspaceDefaultSettings
      )) {
        if (settings.get(key) !== value) {
          return
        }
      }

      return true
    })
  })
})
