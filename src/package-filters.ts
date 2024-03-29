/**
 * Package filters for filtering the packages of a workspace.
 */
export interface MelosPackageFilters {
  readonly scope?: readonly string[]
  readonly ignore?: readonly string[]
  readonly dirExists?: readonly string[]
  readonly fileExists?: readonly string[]
  readonly dependsOn?: readonly string[]
  readonly noDependsOn?: readonly string[]
  readonly diff?: string
  readonly private?: boolean
  readonly published?: boolean
  readonly nullSafety?: boolean
  readonly flutter?: boolean
}
