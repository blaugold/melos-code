import * as assert from 'assert'
import * as vscode from 'vscode'
import { createMelosYaml } from './utils/melos-yaml-utils'
import { retryUntilResult } from './utils/misc-utils'
import { resetWorkspace, workspaceFolder } from './utils/vscode-workspace-utils'

suite('Melos script task provider', () => {
  test('should provide tasks for scripts in melos.yaml', async () => {
    await resetWorkspace()
    await createMelosYaml({
      scripts: {
        a: 'b',
      },
    })

    const tasks = await retryUntilResult(async () => {
      const tasks = await vscode.tasks.fetchTasks({ type: 'melos' })
      return tasks.length === 0 ? undefined : tasks
    })

    assert.strictEqual(tasks.length, 1)

    const task = tasks[0]

    assert.strictEqual(task.name, 'a')
    assert.strictEqual(task.source, 'melos')
    assert.strictEqual(task.detail, 'b')
    assert.deepStrictEqual(task.definition, { type: 'melos', script: 'a' })
    assert.strictEqual(task.scope, workspaceFolder())
  })
})
