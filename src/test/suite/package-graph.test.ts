import * as assert from 'assert'
import * as vscode from 'vscode'
import { workspaceFolder } from '../utils/vscode-workspace-utils'

suite('Melos package graph', () => {
  test('melos.showPackageGraph command shows package graph in webview', async () => {
    const panel = (await vscode.commands.executeCommand(
      'melos.showPackageGraph'
    )) as vscode.WebviewPanel

    assert.strictEqual(panel.title, `Package graph - ${workspaceFolder().name}`)
    assert.notStrictEqual(panel.webview.html, '')
  })
})
