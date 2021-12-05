import * as vscode from 'vscode'
import { createMelosYaml } from './utils/melos-yaml-utils'
import { retryUntilResult } from './utils/misc-utils'
import { resetWorkspace, workspaceFolder } from './utils/vscode-workspace-utils'

suite('Settings', () => {
  test('should apply defaults', async () => {
    await resetWorkspace()
    await createMelosYaml()

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
        if (!settings.get(key) !== value) {
          return
        }
      }

      return true
    })
  })
})
