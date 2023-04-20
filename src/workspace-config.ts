import Ajv, { Schema, ValidateFunction } from 'ajv'
import * as vscode from 'vscode'
import { Document, parseDocument } from 'yaml'
import { Node, Scalar, YAMLMap } from 'yaml/types'
import { info, warn } from './logging'
import { MelosPackageFilters } from './package-filters'
import { readOptionalFile } from './utils/fs-utils'

export const melosYamlFile = 'melos.yaml'

// https://regex101.com/r/idiNSJ/1
const melosExecRegex = /^\s*melos\s*exec/

/**
 * A Melos workspace configuration.
 *
 * Only data currently used by the extension is included.
 */
export interface MelosWorkspaceConfig {
  /**
   * The YAML document from which the configuration was parsed.
   */
  readonly yamlDoc: Document

  /**
   * Configuration for Melos commands.
   */
  readonly command?: MelosCommandsConfig

  /**
   * The configured Melos scripts.
   */
  readonly scripts: readonly MelosScriptConfig[]
}

/**
 * Configuration for Melos commands.
 */
export interface MelosCommandsConfig {
  /**
   * Configuration for the `melos bootstrap` command.
   */
  readonly bootstrap: MelosBootstrapConfig
}

/**
 * Configuration for the `melos bootstrap` command.
 */
export interface MelosBootstrapConfig {
  /**
   * Whether Melos should use `pubspec_overrides.yaml` files to override dependencies.
   */
  readonly usePubspecOverrides?: boolean
}

/**
 * Configuration for a Melos script.
 */
export interface MelosScriptConfig {
  /**
   * The name of the script.
   */
  readonly name: MelosScriptName
  /**
   * The command to run for the script.
   */
  readonly run?: MelosScriptCommand
  /**
   * The package filters to apply for the script.
   */
  readonly packageFilters?: MelosPackageFilters
}

/**
 * The name of a Melos script.
 */
export interface MelosScriptName {
  /**
   * The name of the script.
   */
  readonly value: string
  /**
   * The YAML node that contains the name.
   */
  readonly yamlNode: Node
}

/**
 * A command to run for a Melos script.
 */
export interface MelosScriptCommand {
  /**
   * The command to run.
   */
  readonly value: string
  /**
   * The YAML node that contains the command.
   */
  readonly yamlNode: Node
  /**
   * If the command is a `melos exec` command, the parsed representation of it.
   */
  readonly melosExec?: MelosExecCommand
}

/**
 * Parsed representation of a `melos exec` command line.
 */
export interface MelosExecCommand {
  /**
   * The options for the `exec` command.
   */
  readonly options: string[]
  /**
   * The actual command to run.
   */
  readonly command: string
}

/**
 * Parses the given string as a melos.yaml file.
 *
 * As much as possible of the file is parsed, even if it is invalid.
 */
export function parseMelosWorkspaceConfig(text: string): MelosWorkspaceConfig {
  const doc = parseDocument(text, { keepCstNodes: true })
  return melosWorkspaceConfigFromYamlDoc(doc)
}

/**
 * Returns whether the given workspace configuration was created from a valid
 * file.
 */
export async function isMelosWorkspaceConfigValid(
  context: vscode.ExtensionContext,
  config: MelosWorkspaceConfig
): Promise<boolean> {
  const validate = await getValidateMelosYamlFunction(context)
  return !!validate(config.yamlDoc.toJSON())
}

/**
 * Loads and parses the melos.yaml file for the given workspace {@link folder}.
 *
 * Returns null if the files does not exist.
 *
 * If the file is invalid a warning message is displayed to the user.
 * The partially parsed config is still returned.
 * Validation is base on the JSON schema defined in the
 * {@link melosYamlSchemaFile} file.
 *
 * @param context The extension context.
 */
export async function loadMelosWorkspaceConfig(
  context: vscode.ExtensionContext,
  folder: vscode.WorkspaceFolder
): Promise<MelosWorkspaceConfig | null> {
  const configFile = await readOptionalFile(
    vscode.Uri.joinPath(folder.uri, melosYamlFile)
  )

  if (configFile === null) {
    return null
  }

  const config = parseMelosWorkspaceConfig(configFile.toString())

  if (await isMelosWorkspaceConfigValid(context, config)) {
    info(`Loaded valid ${melosYamlFile} from '${folder.name}' folder`)
  } else {
    warn(`Loaded invalid ${melosYamlFile} from '${folder.name}' folder`)
    showInvalidMelosYamlMessage(folder)
  }

  return config
}

function showInvalidMelosYamlMessage(folder: vscode.WorkspaceFolder) {
  vscode.window.showWarningMessage(
    `The ${melosYamlFile} file in the ${folder.name} folder is invalid.`
  )
}

function melosWorkspaceConfigFromYamlDoc(doc: Document): MelosWorkspaceConfig {
  return {
    yamlDoc: doc,
    command: doc.toJSON()['command'],
    scripts: melosScriptsConfigsFromYaml(doc.get('scripts')),
  }
}

function melosScriptsConfigsFromYaml(value: any): MelosScriptConfig[] {
  if (!(value instanceof YAMLMap)) {
    return []
  }

  return value.items
    .filter((entry) => {
      const name = entry.key
      return name instanceof Scalar && typeof name.value === 'string'
    })
    .map((entry) => {
      const name = entry.key as Scalar

      const scriptName = {
        value: name.value,
        yamlNode: name,
      }

      const definition = entry.value
      if (definition instanceof Scalar) {
        return {
          name: scriptName,
          run: melosScriptCommandFromYaml(definition),
        }
      }

      if (definition instanceof YAMLMap) {
        return {
          name: scriptName,
          run: melosScriptCommandFromYaml(
            definition.get('run', true),
            definition.get('exec', true)
          ),
          packageFilters: melosPackageFiltersFromYaml(
            definition.get('packageFilters', true)
          ),
        }
      }

      return { name: scriptName }
    })
}

function melosScriptCommandFromYaml(
  run: any,
  exec?: any
): MelosScriptCommand | undefined {
  if (exec) {
    if (exec instanceof Scalar) {
      if (typeof exec.value === 'string') {
        return {
          value: exec.value,
          yamlNode: exec,
          melosExec: {
            command: exec.value,
            options: [],
          },
        }
      } else {
        return
      }
    } else if (exec instanceof YAMLMap) {
      if (run instanceof Scalar && typeof run.value === 'string') {
        const options: string[] = []

        const concurrency = exec.get('concurrency')
        if (typeof concurrency === 'number') {
          options.push(`--concurrency=${concurrency}`)
        }

        const failFast = exec.get('failFast')
        if (typeof failFast === 'boolean' && failFast) {
          options.push('--fail-fast')
        }

        return {
          value: run.value,
          yamlNode: run,
          melosExec: {
            command: run.value,
            options: options,
          },
        }
      }
    } else {
      return
    }
  }

  if (run instanceof Scalar && typeof run.value === 'string') {
    return {
      value: run.value,
      yamlNode: run,
      melosExec: parseMelosExecCommand(run.value),
    }
  }

  return
}

function parseMelosExecCommand(
  commandLine: string
): MelosExecCommand | undefined {
  if (!melosExecRegex.test(commandLine)) {
    return
  }

  const [options, command] = commandLine
    .replace(melosExecRegex, '')
    .split(' -- ')
    .map((part) => part.trim())
  if (options === undefined || command === undefined) {
    return
  }

  return {
    options: options === '' ? [] : options.split(/\s+/),
    command,
  }
}

function melosPackageFiltersFromYaml(
  value: any
): MelosPackageFilters | undefined {
  if (!(value instanceof YAMLMap)) {
    return
  }

  const json = value.toJSON() as any

  function getStringList(key: string): string[] | undefined {
    const value = json[key]
    if (value === undefined) {
      return
    }

    if (Array.isArray(value)) {
      return value.filter((value) => typeof value === 'string')
    }

    return typeof value === 'string' ? [value] : undefined
  }

  function getString(key: string): string | undefined {
    const value = json[key]
    if (value === undefined) {
      return
    }

    return typeof value === 'string' ? value : undefined
  }

  function getBoolean(key: string): boolean | undefined {
    const value = json[key]
    if (value === undefined) {
      return
    }

    return typeof value === 'boolean' ? value : undefined
  }

  const noPrivate = getBoolean('noPrivate')
  const privateFromNoPrivate = noPrivate === undefined ? undefined : !noPrivate

  return {
    scope: getStringList('scope'),
    ignore: getStringList('ignore'),
    dirExists: getStringList('dirExists'),
    fileExists: getStringList('fileExists'),
    dependsOn: getStringList('dependsOn'),
    noDependsOn: getStringList('noDependsOn'),
    diff: getString('diff'),
    private: getBoolean('private') ?? privateFromNoPrivate,
    published: getBoolean('published'),
    nullSafety: getBoolean('nullSafety'),
    flutter: getBoolean('flutter'),
  }
}

// === melos.yaml schema ======================================================

/**
 * Location of melos.yaml schema file relative to extension root.
 */
const melosYamlSchemaFile = 'melos.yaml.schema.json'

let validateMelosYamlFunction: Promise<ValidateFunction> | undefined

async function getValidateMelosYamlFunction(
  context: vscode.ExtensionContext
): Promise<ValidateFunction> {
  return (validateMelosYamlFunction ??= loadMelosYamlSchema(
    context.extensionUri
  ).then((schema) => new Ajv().compile(schema)))
}

async function loadMelosYamlSchema(extensionUri: vscode.Uri): Promise<Schema> {
  const rawSchema = await vscode.workspace.fs.readFile(
    vscode.Uri.joinPath(extensionUri, melosYamlSchemaFile)
  )
  return JSON.parse(rawSchema.toString())
}
