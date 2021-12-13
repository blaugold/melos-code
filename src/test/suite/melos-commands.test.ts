import * as assert from 'assert'
import * as vscode from 'vscode'
import { MelosRunScriptCommandArgs } from '../../commands'
import { melosExecutableName } from '../../env'
import { workspaceFolder } from '../utils/vscode-workspace-utils'

suite('Melos commands as VS Code commands', () => {
  commandTest('bootstrap')
  commandTest('clean')

  suite('runScript with args', () => {
    test('simple script', async () => {
      const taskExecution =
        await vscode.commands.executeCommand<vscode.TaskExecution>(
          'melos.runScript',
          {
            workspaceFolder: workspaceFolder(),
            script: 'echo',
          } as MelosRunScriptCommandArgs
        )

      const task = taskExecution?.task
      assert.strictEqual(task?.definition.type, 'melos')
      assert.strictEqual(task?.name, 'echo')
      assert.strictEqual(task?.source, 'melos')
      assert.strictEqual(task.scope, workspaceFolder())
      assert.strictEqual(
        (task.execution as vscode.ShellExecution).commandLine,
        `${melosExecutableName} run --no-select echo`
      )
    })

    test('run exec script in all packages', async () => {
      const taskExecution =
        await vscode.commands.executeCommand<vscode.TaskExecution>(
          'melos.runScript',
          {
            workspaceFolder: workspaceFolder(),
            script: 'echo_exec',
            runInAllPackages: true,
          } as MelosRunScriptCommandArgs
        )

      const task = taskExecution?.task
      assert.strictEqual(task?.definition.type, 'melos')
      assert.strictEqual(task?.name, 'echo_exec')
      assert.strictEqual(task?.source, 'melos')
      assert.strictEqual(task.scope, workspaceFolder())
      assert.strictEqual(
        (task.execution as vscode.ShellExecution).commandLine,
        `${melosExecutableName} run --no-select echo_exec`
      )
    })
  })
})

async function commandTest(name: string) {
  test(`execute ${name}`, async () => {
    const didStartTask = new Promise<void>((resolve) => {
      const disposable = vscode.tasks.onDidStartTask((event) => {
        const task = event.execution.task
        assert.strictEqual(task.definition.type, 'melos')
        assert.strictEqual(task.name, name)
        assert.strictEqual(task.source, 'melos')
        assert.strictEqual(task.scope, workspaceFolder())
        assert.strictEqual(
          (task.execution as vscode.ShellExecution).commandLine,
          `${melosExecutableName} ${name}`
        )

        disposable.dispose()
        resolve()
      })
    })

    const exitCode = await vscode.commands.executeCommand<number | undefined>(
      `melos.${name}`
    )
    assert.strictEqual(exitCode, 0)

    return didStartTask
  })
}
