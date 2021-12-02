import * as vscode from 'vscode'
import { MelosRunScriptCommandArgs } from './commands'
import { parseMelosWorkspaceConfig } from './workspace-config'
import { vscodeRangeFromNode } from './yaml-utils'

export function registerMelosYamlCodeLenseProvider(context: vscode.ExtensionContext) {
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
    if (!workspaceFolder) {
      return []
    }

    const workspaceConfig = parseMelosWorkspaceConfig(document.getText())

    return workspaceConfig.scripts.map((script) => {
      const name = script.name

      const runScriptCommandArgs: MelosRunScriptCommandArgs = {
        workspaceFolder,
        script: name.value,
      }

      return new vscode.CodeLens(vscodeRangeFromNode(document, name.yamlNode), {
        title: `Run ${name.value}`,
        command: 'melos.runScript',
        arguments: [runScriptCommandArgs],
      })
    })
  }
}
