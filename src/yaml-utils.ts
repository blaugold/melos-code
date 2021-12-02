import { Range, TextDocument } from 'vscode'
import { Node } from 'yaml/types'

export function vscodeRangeFromNode(doc: TextDocument, node: Node): Range {
  return new Range(
    doc.positionAt(node.range![0]),
    doc.positionAt(node.range![1])
  )
}
