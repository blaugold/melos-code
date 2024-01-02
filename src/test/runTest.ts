import * as vscode from '@vscode/test-electron'
import * as cp from 'child_process'
import * as path from 'path'

let exitCode = 0

const vscodeVersion = process.env.VSCODE_VERSION ?? 'stable'
const extensionDevelopmentPath = path.resolve(__dirname, '../../')
const extensionDependencies: string[] =
  require('../../package.json').extensionDependencies

async function runTests(suiteName: string) {
  try {
    const extensionTestsPath = path.resolve(__dirname, suiteName)
    const workspaceDir = path.resolve(
      __dirname,
      '../../src/test/workspaces',
      suiteName
    )

    const res = await vscode.runTests({
      version: vscodeVersion,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspaceDir],
      extensionTestsEnv: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        MELOS_CODE_CONSOLE_LOG_LEVEL: 'debug',
        ...process.env,
      },
    })
    exitCode = exitCode || res
  } catch (err) {
    console.error(err)
    exitCode = exitCode || 999
  }
}

async function main() {
  const vscodeExecutablePath = await vscode.downloadAndUnzipVSCode(
    vscodeVersion
  )

  const [cli, ...args] =
    vscode.resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath)

  // Ensure that the redhat.vscode-yaml extension is installed.
  // This is a dependency of this extension and provides the language
  // definition for yaml, which is needed to activate this extension.
  for (const extension of extensionDependencies) {
    cp.spawnSync(cli, [...args, '--install-extension', extension], {
      encoding: 'utf-8',
      stdio: 'inherit',
    })
  }

  try {
    await runTests('suite')
  } catch (err) {
    console.error(err)
    exitCode = 1
  }
}

main().then(() => process.exit(exitCode))
