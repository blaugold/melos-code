import * as vscode from 'vscode'
import { MelosRunScriptCommandArgs } from './commands'
import { debug } from './logging'
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
    const melosConfig = parseMelosWorkspaceConfig(document.getText())

    return [
      ...this.buildRunScriptCodeLenses(melosConfig, workspaceFolder, document),
    ]
  }

  private buildRunScriptCodeLenses(
    melosConfig: MelosWorkspaceConfig,
    workspaceFolder: vscode.WorkspaceFolder | undefined,
    document: vscode.TextDocument
  ) {
    if (!workspaceFolder) {
      // We need a workspace folder to run scripts.
      return []
    }

    debug(
      `Providing 'Run script' CodeLenses in '${workspaceFolder.name}' folder`,
      melosConfig.scripts.map((script) => script.name.value)
    )

    return melosConfig.scripts.map((script) => {
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
