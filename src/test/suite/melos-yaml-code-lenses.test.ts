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

    const codeLenses = await retryUntilResult(() =>
      resolveMelosYamlCodeLenses().then((lenses) => {
        if (!lenses) {
          return
        }
        const runScriptCodeLenses = lenses?.filter(
          (codeLense) => codeLense.command?.command === 'melos.runScript'
        )
        if (runScriptCodeLenses.length === 0) {
          return
        }
        return runScriptCodeLenses
      })
    )

    let codeLense = codeLenses[0]
    assert.deepStrictEqual(codeLense.range, new vscode.Range(4, 2, 4, 3))
    assert.strictEqual(codeLense.command?.title, 'Run script')
    assert.strictEqual(codeLense.command?.command, 'melos.runScript')
    assert.deepStrictEqual(codeLense.command?.arguments, [
      {
        workspaceFolder: workspaceFolder(),
        script: 'a',
      },
    ])

    codeLense = codeLenses[1]
    assert.deepStrictEqual(codeLense.range, new vscode.Range(5, 2, 5, 3))
    assert.strictEqual(codeLense.command?.title, 'Run script')
    assert.strictEqual(codeLense.command?.command, 'melos.runScript')
    assert.deepStrictEqual(codeLense.command?.arguments, [
      {
        workspaceFolder: workspaceFolder(),
        script: 'b',
      },
    ])

    codeLense = codeLenses[2]
    assert.deepStrictEqual(codeLense.range, new vscode.Range(5, 2, 5, 3))
    assert.strictEqual(codeLense.command?.title, 'Run script in all packages')
    assert.strictEqual(codeLense.command?.command, 'melos.runScript')
    assert.deepStrictEqual(codeLense.command?.arguments, [
      {
        workspaceFolder: workspaceFolder(),
        script: 'b',
        runInAllPackages: true,
      },
    ])
  })
})
