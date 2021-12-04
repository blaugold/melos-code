import { merge } from 'lodash'
import * as vscode from 'vscode'
import * as YAML from 'yaml'
import { writeFileAsString } from './fs-utils'
import { workspaceFolder } from './vscode-workspace-utils'

const melosYamlPath = 'melos.yaml'

function melosYamlUri() {
  return vscode.Uri.joinPath(workspaceFolder().uri, melosYamlPath)
}

function melosYamlDefault() {
  return {
    name: 'melos',
    packages: ['packages/**'],
  }
}

export async function createMelosYaml(content: any = {}) {
  await writeFileAsString(
    melosYamlUri(),
    YAML.stringify(merge(melosYamlDefault(), content))
  )
}

export async function openMelosYamlInEditor(): Promise<vscode.TextEditor> {
  const doc = await vscode.workspace.openTextDocument(melosYamlUri())
  return await vscode.window.showTextDocument(doc)
}

export async function resolveMelosYamlCodeLenses(): Promise<vscode.CodeLens[]> {
  const codeLenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
    'vscode.executeCodeLensProvider',
    melosYamlUri()
  )
  return codeLenses!
}
