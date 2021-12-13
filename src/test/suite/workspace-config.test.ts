import * as assert from 'assert'
import { parseMelosWorkspaceConfig } from '../../workspace-config'

suite('MelosWorkspaceConfig', () => {
  suite('parseMelosWorkspaceConfig', () => {
    test('parses partial config', async () => {
      const config = parseMelosWorkspaceConfig(`
scripts:
    a: a
`)

      assert.strictEqual(config.scripts.length, 1)
      assert.strictEqual(config.scripts[0].name.value, 'a')
      assert.strictEqual(config.scripts[0].run?.value, 'a')
    })

    test('parses scripts', async () => {
      const config = parseMelosWorkspaceConfig(
        `scripts:
    a: a
    b:
        run: a
`
      )

      assert.strictEqual(config.scripts.length, 2)

      const scriptA = config.scripts.find((s) => s.name.value === 'a')!
      const scriptB = config.scripts.find((s) => s.name.value === 'b')!

      assert.strictEqual(scriptA.name.value, 'a')
      assert.deepStrictEqual(
        scriptA.name.yamlNode.cstNode?.rangeAsLinePos?.start,
        {
          line: 2,
          col: 5,
        }
      )
      assert.strictEqual(scriptA.run?.value, 'a')
      assert.deepStrictEqual(
        scriptA.run.yamlNode.cstNode?.rangeAsLinePos?.start,
        {
          line: 2,
          col: 8,
        }
      )
      assert.strictEqual(scriptB.name.value, 'b')
      assert.deepStrictEqual(
        scriptB.name.yamlNode.cstNode?.rangeAsLinePos?.start,
        {
          line: 3,
          col: 5,
        }
      )
      assert.strictEqual(scriptB.run?.value, 'a')
      assert.deepStrictEqual(
        scriptB.run.yamlNode.cstNode?.rangeAsLinePos?.start,
        {
          line: 4,
          col: 14,
        }
      )
    })

    test('parse melos exec command', () => {
      let config = parseMelosWorkspaceConfig(
        `scripts:
    a: melos exec -- a
`
      )

      assert.deepStrictEqual(config.scripts[0].run?.melosExec, {
        options: [],
        command: 'a',
      })

      config = parseMelosWorkspaceConfig(
        `scripts:
    a: melos exec --c 1 -- a
`
      )

      assert.deepStrictEqual(config.scripts[0].run?.melosExec, {
        options: ['--c', '1'],
        command: 'a',
      })
    })

    test('parse select-package section of scripts', () => {
      let config = parseMelosWorkspaceConfig(
        `scripts:
    a:
        run: b
        select-package:
            scope: a
            ignore: b
            file-exists: c
            dir-exists: d
            depends-on: e
            no-depends-on: f
            since: g
            private: true
            published: true
            null-safety: true
            flutter: true
`
      )

      assert.deepStrictEqual(config.scripts[0].packageSelect, {
        scope: ['a'],
        ignore: ['b'],
        fileExists: ['c'],
        dirExists: ['d'],
        dependsOn: ['e'],
        noDependsOn: ['f'],
        since: 'g',
        private: true,
        published: true,
        nullSafety: true,
        flutter: true,
      })

      config = parseMelosWorkspaceConfig(
        `scripts:
    a:
        run: b
        select-package:
            scope:
                - a
            ignore:
                - b
            file-exists:
                - c
            dir-exists:
                - d
            depends-on:
                - e
            no-depends-on:
                - f
`
      )

      assert.deepStrictEqual(config.scripts[0].packageSelect, {
        scope: ['a'],
        ignore: ['b'],
        fileExists: ['c'],
        dirExists: ['d'],
        dependsOn: ['e'],
        noDependsOn: ['f'],
        since: undefined,
        private: undefined,
        published: undefined,
        nullSafety: undefined,
        flutter: undefined,
      })
    })
  })
})
