import * as assert from 'assert'
import * as vscode from 'vscode'
import {
  openMelosYamlInEditor,
  resolveMelosYamlCodeLenses,
} from '../utils/melos-yaml-utils'
import { retryUntilResult } from '../utils/misc-utils'
import { workspaceFolder } from '../utils/vscode-workspace-utils'

suite('melos.yaml CodeLenses', () => {
  test('should provide lenses to run scripts', async () => {
    await openMelosYamlInEditor()

    const runScriptCodeLens = await retryUntilResult(() =>
      resolveMelosYamlCodeLenses().then((lenses) =>
        lenses?.find(
          (codeLense) => codeLense.command?.command === 'melos.runScript'
        )
      )
    )

    assert.deepStrictEqual(
      runScriptCodeLens.range,
      new vscode.Range(4, 2, 4, 3)
    )
    assert.strictEqual(runScriptCodeLens.command?.title, 'Run script')
    assert.strictEqual(runScriptCodeLens.command?.command, 'melos.runScript')
    assert.deepStrictEqual(runScriptCodeLens.command?.arguments, [
      {
        workspaceFolder: workspaceFolder(),
        script: 'a',
      },
    ])
  })
})
