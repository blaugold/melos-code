import * as assert from 'assert'
import * as vscode from 'vscode'
import { melosExecutableName } from '../../env'
import { retryUntilResult } from '../utils/misc-utils'
import { workspaceFolder } from '../utils/vscode-workspace-utils'

suite('Melos script task provider', () => {
  test('should provide tasks for scripts in melos.yaml', async () => {
    const tasks = await retryUntilResult(async () => {
      const tasks = await vscode.tasks.fetchTasks({ type: 'melos' })
      return tasks.length === 0 ? undefined : tasks
    })

    assert.strictEqual(tasks.length, 4)

    let task = tasks[0]
    assert.strictEqual(task.name, 'a')
    assert.strictEqual(task.source, 'melos')
    assert.strictEqual(task.detail, 'b')
    assert.deepStrictEqual(task.definition, { type: 'melos', script: 'a' })
    assert.strictEqual(task.scope, workspaceFolder())
    assert.strictEqual(
      (task.execution as vscode.ShellExecution).commandLine,
      `${melosExecutableName} run --no-select a`
    )

    task = tasks[1]
    assert.strictEqual(task.name, 'b')
    assert.strictEqual(task.source, 'melos')
    assert.strictEqual(task.detail, 'melos exec -- echo b')
    assert.deepStrictEqual(task.definition, { type: 'melos', script: 'b' })
    assert.strictEqual(task.scope, workspaceFolder())
    assert.strictEqual(
      (task.execution as vscode.ShellExecution).commandLine,
      `${melosExecutableName} run --no-select b`
    )

    task = tasks[2]
    assert.strictEqual(task.name, 'echo')
    assert.strictEqual(task.source, 'melos')
    assert.strictEqual(task.detail, 'echo Hello world')
    assert.deepStrictEqual(task.definition, { type: 'melos', script: 'echo' })
    assert.strictEqual(task.scope, workspaceFolder())
    assert.strictEqual(
      (task.execution as vscode.ShellExecution).commandLine,
      `${melosExecutableName} run --no-select echo`
    )

    task = tasks[3]
    assert.strictEqual(task.name, 'echo_exec')
    assert.strictEqual(task.source, 'melos')
    assert.strictEqual(task.detail, 'melos exec -- echo Hello world')
    assert.deepStrictEqual(task.definition, {
      type: 'melos',
      script: 'echo_exec',
    })
    assert.strictEqual(task.scope, workspaceFolder())
    assert.strictEqual(
      (task.execution as vscode.ShellExecution).commandLine,
      `${melosExecutableName} run --no-select echo_exec`
    )
  })
})
