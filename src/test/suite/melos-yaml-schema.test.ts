import Ajv, { ValidateFunction } from 'ajv'
import * as assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'
import * as YAML from 'yaml'

suite('melos.yaml Schema', () => {
  setup(() => {
    const melosYamlSchema = fs.readFileSync(
      path.join(__dirname, '../../../melos.yaml.schema.json'),
      'utf8'
    )
    melosYamlValidationFn = new Ajv().compile(JSON.parse(melosYamlSchema))
  })

  test('accept minimal config', () => {
    assertValidMelosYaml(`
name: a
packages:
    - a
`)
  })

  test('reject empty melos.yaml', () => {
    assertInvalidMelosYaml(`
`)
  })

  test('reject additional props at root', () => {
    assertInvalidMelosYaml(
      `
name: a
packages:
    - a
a: a
`,
      { instancePath: '', keyword: 'additionalProperties' }
    )
  })

  test('accept repository option', () => {
    assertValidMelosYaml(`
name: a
repository: https://github.com/user/repo
packages:
  - a
`)
  })

  test('accept intellij ide config', () => {
    assertValidMelosYaml(`
name: a
packages:
  - a
ide:
  intellij: true
`)
  })

  test('reject additional props in ide config', () => {
    assertInvalidMelosYaml(
      `
name: a
packages:
    - a
ide:
    a: a
`,
      { instancePath: '/ide', keyword: 'additionalProperties' }
    )
  })

  test('accept version command config', () => {
    assertValidMelosYaml(`
name: a
packages:
  - a
command:
  version:
      message: a
      linkToCommits: true
      branch: a
`)
  })

  test('reject additional props in command config', () => {
    assertInvalidMelosYaml(
      `
name: a
packages:
    - a
command:
    a: a
`,
      { instancePath: '/command', keyword: 'additionalProperties' }
    )
  })

  test('reject additional props in version command config', () => {
    assertInvalidMelosYaml(
      `
name: a
packages:
    - a
command:
    version:
        a: a
`,
      { instancePath: '/command/version', keyword: 'additionalProperties' }
    )
  })

  test('accept simple script config', () => {
    assertValidMelosYaml(`
name: a
packages:
  - a
scripts:
  a: a
`)
  })

  test('accept full script config', () => {
    assertValidMelosYaml(`
name: a
packages:
  - a
scripts:
  a:
      name: a
      description: a
      run: a
      env:
          a: a
      packageFilters:
          scope: a
          ignore: a
          dirExists: a
          fileExists: a
          dependsOn: a
          noDependsOn: a
          diff: a
          private: true
          noPrivate: false
          published: true
          nullSafety: true
          flutter: true
  b:
      run: a
      packageFilters:
          scope:
              - a
          ignore:
              - a
          dirExists:
              - a
          fileExists:
              - a
          dependsOn:
              - a
          noDependsOn:
              - a
`)
  })

  test('reject additional props in script config', () => {
    assertInvalidMelosYaml(
      `
name: a
packages:
    - a
scripts:
    a:
        run: a
        a: a
`,
      { instancePath: '/scripts/a', keyword: 'additionalProperties' }
    )
  })

  test('reject additional props in script packageFilters config', () => {
    assertInvalidMelosYaml(
      `
name: a
packages:
    - a
scripts:
    a:
        run: a
        packageFilters:
            a: a
`,
      {
        instancePath: '/scripts/a/packageFilters',
        keyword: 'additionalProperties',
      }
    )
  })
})

let melosYamlValidationFn: ValidateFunction

function assertValidMelosYaml(content: string) {
  const yamlContent = YAML.parse(content)
  const valid = melosYamlValidationFn(yamlContent)
  if (!valid) {
    assert.fail(
      melosYamlValidationFn
        .errors!.map((e) => JSON.stringify(e, null, 2))
        .join('\n')
    )
  }
}

function assertInvalidMelosYaml(
  content: string,
  options?: { instancePath?: string; keyword?: string }
) {
  if (options?.keyword !== undefined && options.instancePath === undefined) {
    throw new Error('instancePath is required when keyword is specified')
  }

  const yamlContent = YAML.parse(content)
  const valid = melosYamlValidationFn(yamlContent)

  if (valid) {
    assert.fail(`Expected melos.yaml to be invalid\n${content}`)
  }

  if (options?.instancePath !== undefined) {
    const error = melosYamlValidationFn.errors!.find((error) =>
      error.instancePath === options?.instancePath &&
      options?.keyword !== undefined
        ? error.keyword === options?.keyword
        : true
    )

    if (!error) {
      assert.fail(
        `Expected error at ${options.instancePath}
${content}
${JSON.stringify(melosYamlValidationFn.errors!, null, 2)}`
      )
    }
  }
}
