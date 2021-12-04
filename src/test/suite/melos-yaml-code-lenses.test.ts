import * as assert from 'assert'
import * as vscode from 'vscode'
import {
  createMelosYaml,
  openMelosYamlInEditor,
  resolveMelosYamlCodeLenses,
} from './utils/melos-yaml-utils'
import { resetWorkspace, workspaceFolder } from './utils/vscode-workspace-utils'

suite('melos.yaml CodeLenses', () => {
  test('should provide lenses to run scripts', async () => {
    await resetWorkspace()

    await createMelosYaml({
      scripts: {
        test: 'echo a',
      },
    })

    await openMelosYamlInEditor()

    const codeLenses = await resolveMelosYamlCodeLenses()
    const runScriptCodeLens = codeLenses.find(
      (codeLense) => codeLense.command?.command === 'melos.runScript'
    )

    assert.ok(runScriptCodeLens?.range?.isEqual(new vscode.Range(4, 2, 4, 6)))
    assert.strictEqual(runScriptCodeLens?.command?.title, 'Run script')
    assert.strictEqual(runScriptCodeLens?.command?.command, 'melos.runScript')
    assert.deepStrictEqual(runScriptCodeLens?.command?.arguments, [
      {
        workspaceFolder: workspaceFolder(),
        script: 'test',
      },
    ])
  })
})
