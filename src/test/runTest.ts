import {
  downloadAndUnzipVSCode,
  resolveCliPathFromVSCodeExecutablePath,
  runTests,
} from '@vscode/test-electron'
import * as cp from 'child_process'
import * as path from 'path'

function getExtensionDependencies(): string[] {
  const packageJson = require('../../package.json')
  return packageJson.extensionDependencies
}

async function main() {
  try {
    const vscodeVersion = 'stable'
    const vscodeExecutablePath = await downloadAndUnzipVSCode(vscodeVersion)
    const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath)

    // Ensure that the redhat.vscode-yaml extension is installed.
    // This is a dependency of this extension and provides the language
    // definition for yaml, which is needed to activate this extension.
    const extensionDependencies = getExtensionDependencies()
    for (const extension of extensionDependencies) {
      cp.execSync(`"${cliPath}" --force --install-extension=${extension}`, {
        stdio: 'inherit',
      })
    }

    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../../')

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './suite/index')

    const workspaceDir = path.resolve(__dirname, '../../melos-workspaces/test')

    // Download VS Code, unzip it and run the integration test
    await runTests({
      version: vscodeVersion,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspaceDir],
      extensionTestsEnv: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        MELOS_CODE_CONSOLE_LOG_LEVEL: 'debug',
      },
    })
  } catch (err) {
    console.error('Failed to run tests')
    process.exit(1)
  }
}

main()
