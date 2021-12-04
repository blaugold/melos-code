import * as vscode from 'vscode'
import { MelosRunScriptCommandArgs } from './commands'
import { vscodeRangeFromNode } from './utils/yaml-utils'
import {
  MelosWorkspaceConfig,
  parseMelosWorkspaceConfig,
} from './workspace-config'

export function registerMelosYamlCodeLenseProvider(
  context: vscode.ExtensionContext
) {
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { language: 'yaml', pattern: '**/melos.yaml' },
      new MelosYamlCodeLenseProvider()
    )
  )
}

class MelosYamlCodeLenseProvider implements vscode.CodeLensProvider {
  async provideCodeLenses(document: vscode.TextDocument) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
    const workspaceConfig = parseMelosWorkspaceConfig(document.getText())

    return [
      ...this.buildRunScriptCodeLenses(
        workspaceConfig,
        workspaceFolder,
        document
      ),
    ]
  }

  private buildRunScriptCodeLenses(
    workspaceConfig: MelosWorkspaceConfig,
    workspaceFolder: vscode.WorkspaceFolder | undefined,
    document: vscode.TextDocument
  ) {
    if (!workspaceFolder) {
      // We need a workspace folder to run scripts.
      return []
    }

    return workspaceConfig.scripts.map((script) => {
      const name = script.name

      const runScriptCommandArgs: MelosRunScriptCommandArgs = {
        workspaceFolder,
        script: name.value,
      }

      return new vscode.CodeLens(vscodeRangeFromNode(document, name.yamlNode), {
        title: `Run script`,
        command: 'melos.runScript',
        arguments: [runScriptCommandArgs],
      })
    })
  }
}
