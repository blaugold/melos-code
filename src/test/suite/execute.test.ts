import * as assert from 'assert'
import * as vscode from 'vscode'
import {
  buildPackageFilterOption,
  melosList,
  MelosListFormat,
  MelosPackageType,
} from '../../execute'
import { workspaceFolder } from '../utils/vscode-workspace-utils'

suite('execute', () => {
  suite('melosList', () => {
    test('JSON result type', async () => {
      const result = await melosList({
        format: MelosListFormat.json,
        folder: workspaceFolder(),
      })

      assert.deepStrictEqual(result, [
        {
          location: vscode.Uri.joinPath(workspaceFolder().uri, 'packages/a')
            .fsPath,
          name: 'a',
          private: false,
          type: MelosPackageType.dartPackage,
          version: '0.0.0',
        },
        {
          location: vscode.Uri.joinPath(workspaceFolder().uri, 'packages/b')
            .fsPath,
          name: 'b',
          private: false,
          type: MelosPackageType.dartPackage,
          version: '0.0.0',
        },
      ])
    })

    test('Graphviz result type', async () => {
      const result = await melosList({
        format: MelosListFormat.gviz,
        folder: workspaceFolder(),
      })

      assert.strictEqual(
        result,
        `digraph packages {
  size="10"; ratio=fill;
  a [shape="box"; color="#ff5307"];
  b [shape="box"; color="#e03cc2"];
  subgraph "cluster packages" {
    label="packages";
    color="#6b4949";
    a;
    b;
  }
}
`
      )
    })
  })

  test('buildPackageFilterOption', () => {
    assert.deepStrictEqual(
      buildPackageFilterOption({
        scope: ['a'],
        ignore: ['b'],
        dependsOn: ['c'],
        noDependsOn: ['d'],
        fileExists: ['e'],
        dirExists: ['f'],
        since: 'g',
        private: true,
        published: true,
        nullSafety: true,
        flutter: true,
      }),
      [
        '--scope',
        'a',
        '--ignore',
        'b',
        '--depends-on',
        'c',
        '--no-depends-on',
        'd',
        '--file-exists',
        'e',
        '--dir-exists',
        'f',
        '--since',
        'g',
        '--private',
        '--published',
        '--null-safety',
        '--flutter',
      ]
    )

    assert.deepStrictEqual(
      buildPackageFilterOption({
        private: false,
        published: false,
        nullSafety: false,
        flutter: false,
      }),
      ['--no-private', '--no-published', '--no-null-safety', '--no-flutter']
    )
  })
})
