import * as vscode from 'vscode'

export async function writeFileAsString(uri: vscode.Uri, content: string) {
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'))
}
