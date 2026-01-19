import { isPackageExists as isPackageInstalled } from 'local-pkg'
import { getFileBasedRouteName, isArray, warn } from './core/utils'
import type { TreeNode } from './core/tree'
import { resolve } from 'pathe'
import { EditableTreeNode } from './core/extendRoutes'
import { type ParseSegmentOptions } from './core/treeNodeValue'
import { type _Awaitable } from './utils'

/**
 * Options for a routes folder.
 */
export interface RoutesFolderOption {
  /**
   * Folder to scan files that should be used for routes. **Cannot be a glob**, use the `path`, `filePatterns`, and
   * `exclude` options to filter out files. This section will **be removed** from the resulting path.
   */
  src: string

  /**
   * Prefix to add to the route path **as is**. Defaults to `''`. Can also be a function
   * to reuse parts of the filepath, in that case you should return a **modified version of the filepath**.
   *
   * @example
   * ```js
   * {
   *   src: 'src/pages',
   *   // this is equivalent to the default behavior
   *   path: (file) => file.slice(file.lastIndexOf('src/pages') + 'src/pages'.length
   * },
   * {
   *   src: 'src/features',
   *   // match all files (note the \ is not needed in real code)
   *   filePatterns: '*‍/pages/**\/',
   *   path: (file) => {
   *     const prefix = 'src/features'
   *     // remove the everything before src/features and removes /pages
   *     // /src/features/feature1/pages/index.vue -> feature1/index.vue
   *     return file.slice(file.lastIndexOf(prefix) + prefix.length + 1).replace('/pages', '')
   *   },
   * },
   * {
   *   src: 'src/docs',
   *   // adds a prefix with a param
   *   path: 'docs/[lang]/',
   * },
   * ```
   */
  path?: string | ((filepath: string) => string)

  /**
   * Allows to override the global `filePattern` option for this folder. It can also extend the global values by passing
   * a function that returns an array.
   */
  filePatterns?: _OverridableOption<string[], string | string[]>

  /**
   * Allows to override the global `exclude` option for this folder. It can
   * also extend the global values by passing a function that returns an array.
   */
  exclude?: _OverridableOption<string[], string | string[]>

  /**
   * Allows to override the global `extensions` option for this folder. It can
   * also extend the global values by passing a function that returns an array.
   * The provided extensions are removed from the final route. For example,
   * `.page.vue` allows to suffix all pages with `.page.vue` and remove it from
   * the route name.
   */
  extensions?: _OverridableOption<string[]>
}

/**
 * Normalized options for a routes folder.
 */
export interface RoutesFolderOptionResolved extends RoutesFolderOption {
  path: string | ((filepath: string) => string)
  /**
   * Final glob pattern to match files in the folder.
   */
  pattern: string[]
  filePatterns: string[]
  exclude: string[]
  extensions: string[]
}

export type _OverridableOption<T, AllowedTypes = T> =
  | AllowedTypes
  | ((existing: T) => T)

/**
 * Resolves an overridable option by calling the function with the existing value if it's a function, otherwise
 * returning the passed `value`. If `value` is undefined, it returns the `defaultValue` instead.
 *
 * @param defaultValue default value for the option
 * @param value and overridable option
 */
export function resolveOverridableOption<T>(
  defaultValue: T,
  value?: _OverridableOption<T, T>
): T {
  return typeof value === 'function'
    ? (value as (existing: T) => T)(defaultValue)
    : (value ?? defaultValue)
}

export type _RoutesFolder = string | RoutesFolderOption
export type RoutesFolder = _RoutesFolder[] | _RoutesFolder

/**
 * vue-router plugin options.
 */
export interface Options {
  /**
   * Extensions of files to be considered as pages. Cannot be empty. This allows to strip a
   * bigger part of the filename e.g. `index.page.vue` -> `index` if an extension of `.page.vue` is provided.
   * @default `['.vue']`
   */
  extensions?: string[]

  /**
   * Folder(s) to scan for files and generate routes. Can also be an array if you want to add multiple
   * folders, or an object if you want to define a route prefix. Supports glob patterns but must be a folder, use
   * `extensions` and `exclude` to filter files.
   *
   * @default `"src/pages"`
   */
  routesFolder?: RoutesFolder

  /**
   * Array of `picomatch` globs to ignore. Note the globs are relative to the cwd, so avoid writing
   * something like `['ignored']` to match folders named that way, instead provide a path similar to the `routesFolder`:
   * `['src/pages/ignored/**']` or use `['**​/ignored']` to match every folder named `ignored`.
   * @default `[]`
   */
  exclude?: string[] | string

  /**
   * Pattern to match files in the `routesFolder`. Defaults to `*\/*` plus a
   * combination of all the possible extensions, e.g. `*\/*.{vue,md}` if
   * `extensions` is set to `['.vue', '.md']`. This is relative to the {@link
   * RoutesFolderOption['src']} and
   *
   * @default `['*\/*']`
   */
  filePatterns?: string[] | string

  /**
   * Method to generate the name of a route. It's recommended to keep the default value to guarantee a consistent,
   * unique, and predictable naming.
   */
  getRouteName?: (node: TreeNode) => string

  /**
   * Allows to extend a route by modifying its node, adding children, or even deleting it. This will be invoked once for
   * each route.
   *
   * @param route - {@link EditableTreeNode} of the route to extend
   */
  extendRoute?: (route: EditableTreeNode) => _Awaitable<void>

  /**
   * Allows to do some changes before writing the files. This will be invoked **every time** the files need to be written.
   *
   * @param rootRoute - {@link EditableTreeNode} of the root route
   */
  beforeWriteFiles?: (rootRoute: EditableTreeNode) => _Awaitable<void>

  /**
   * Defines how page components should be imported. Defaults to dynamic imports to enable lazy loading of pages.
   * @default `'async'`
   */
  importMode?: 'sync' | 'async' | ((filepath: string) => 'sync' | 'async')

  /**
   * Root of the project. All paths are resolved relatively to this one.
   * @default `process.cwd()`
   */
  root?: string

  /**
   * Language for `<route>` blocks in SFC files.
   * @default `'json5'`
   */
  routeBlockLang?: 'yaml' | 'yml' | 'json5' | 'json'

  /**
   * Should we generate d.ts files or ont. Defaults to `true` if `typescript` is installed. Can be set to a string of
   * the filepath to write the d.ts files to. By default it will generate a file named `typed-router.d.ts`.
   * @default `true`
   */
  dts?: boolean | string

  /**
   * Allows inspection by vite-plugin-inspect by not adding the leading `\0` to the id of virtual modules.
   * @internal
   */
  _inspect?: boolean

  /**
   * Activates debug logs.
   */
  logs?: boolean

  /**
   * @inheritDoc ParseSegmentOptions
   */
  pathParser?: ParseSegmentOptions

  /**
   * Whether to watch the files for changes.
   *
   * Defaults to `true` unless the `CI` environment variable is set.
   *
   * @default `!process.env.CI`
   */
  watch?: boolean

  /**
   * Experimental options. **Warning**: these can change or be removed at any time, even it patch releases. Keep an eye
   * on the Changelog.
   */
  experimental?: {
    /**
     * (Vite only). File paths or globs where loaders are exported. This will be used to filter out imported loaders and
     * automatically re export them in page components. You can for example set this to `'src/loaders/**\/*'` (without
     * the backslash) to automatically re export any imported variable from files in the `src/loaders` folder within a
     * page component.
     */
    autoExportsDataLoaders?: string | string[]

    /**
     * Enable experimental support for the new custom resolvers and allows
     * defining custom param matchers.
     */
    paramParsers?: boolean | ParamParsersOptions
  }
}

export interface ParamParsersOptions {
  /**
   * Folder(s) to scan for param matchers. Set to an empty array to disable the feature.
   *
   * @default `['src/params']`
   */
  dir?: string | string[]
}

export const DEFAULT_PARAM_PARSERS_OPTIONS = {
  dir: ['src/params'],
} satisfies Required<ParamParsersOptions>

export const DEFAULT_OPTIONS = {
  extensions: ['.vue'],
  exclude: [],
  routesFolder: 'src/pages',
  filePatterns: ['**/*'],
  routeBlockLang: 'json5',
  getRouteName: getFileBasedRouteName,
  importMode: 'async',
  root: process.cwd(),
  dts: isPackageInstalled('typescript'),
  logs: false,
  _inspect: false,
  pathParser: {
    dotNesting: true,
  },
  watch: !process.env.CI,
  experimental: {},
} satisfies Options

export interface ServerContext {
  /**
   * Invalidates a module by its id.
   * @param module - module id to invalidate
   *
   * @returns A promise that resolves when the module is invalidated, or `false` if the module was not found.
   */
  invalidate: (module: string) => Promise<void> | false

  /**
   * Invalidates all modules associated with a page file.
   * @param filepath - file path of the page to invalidate
   *
   * @returns A promise that resolves when the page is invalidated, or `false` if no modules were found for the page.
   */
  invalidatePage: (filepath: string) => Promise<void> | false

  /**
   * Triggers HMR for the routes module.
   */
  updateRoutes: () => Promise<void>

  /**
   * Triggers a full page reload.
   */
  reload: () => void
}

function normalizeRoutesFolderOption(routesFolder: RoutesFolder) {
  return (isArray(routesFolder) ? routesFolder : [routesFolder]).map(
    routeOption =>
      // normalizing here allows to have a better type for the resolved options
      normalizeRouteOption(
        typeof routeOption === 'string' ? { src: routeOption } : routeOption
      )
  )
}

function normalizeRouteOption(routeOption: RoutesFolderOption) {
  return {
    ...routeOption,
    // ensure filePatterns is always an array or a function
    filePatterns: routeOption.filePatterns
      ? typeof routeOption.filePatterns === 'function'
        ? routeOption.filePatterns
        : isArray(routeOption.filePatterns)
          ? routeOption.filePatterns
          : [routeOption.filePatterns]
      : undefined,

    // same for exclude
    exclude: routeOption.exclude
      ? typeof routeOption.exclude === 'function'
        ? routeOption.exclude
        : isArray(routeOption.exclude)
          ? routeOption.exclude
          : [routeOption.exclude]
      : undefined,
  }
}

/**
 * Normalize user options with defaults and resolved paths.
 *
 * @param options - user provided options
 * @returns normalized options
 */
export function resolveOptions(options: Options) {
  const root = options.root || DEFAULT_OPTIONS.root

  // normalize the paths with the root
  const routesFolder = normalizeRoutesFolderOption(
    options.routesFolder || DEFAULT_OPTIONS.routesFolder
  ).map(routeOption => ({
    ...routeOption,
    src: resolve(root, routeOption.src),
  }))

  const paramParsers = options.experimental?.paramParsers
    ? options.experimental.paramParsers === true
      ? DEFAULT_PARAM_PARSERS_OPTIONS
      : {
          ...DEFAULT_PARAM_PARSERS_OPTIONS,
          ...options.experimental.paramParsers,
        }
    : // this way we can do paramParsers?.dir
      undefined

  const paramParsersDir = (
    paramParsers?.dir
      ? isArray(paramParsers.dir)
        ? paramParsers.dir
        : [paramParsers.dir]
      : []
  ).map(dir => resolve(root, dir))

  const autoExportsDataLoaders = options.experimental?.autoExportsDataLoaders
    ? (isArray(options.experimental.autoExportsDataLoaders)
        ? options.experimental.autoExportsDataLoaders
        : [options.experimental.autoExportsDataLoaders]
      ).map(path => resolve(root, path))
    : undefined

  const experimental = {
    ...options.experimental,
    autoExportsDataLoaders,
    // keep undefined if paramParsers is not set
    paramParsers: paramParsers && {
      ...paramParsers,
      dir: paramParsersDir,
    },
  }

  if (options.extensions) {
    options.extensions = options.extensions
      // ensure that extensions start with a dot or warn the user
      // this is needed when filtering the files with the pattern .{vue,js,ts}
      // in src/index.ts
      .map(ext => {
        if (!ext.startsWith('.')) {
          warn(`Invalid extension "${ext}". Extensions must start with a dot.`)
          return '.' + ext
        }
        return ext
      })
      // sort extensions by length to ensure that the longest one is used first
      // e.g. ['.vue', '.page.vue'] -> ['.page.vue', '.vue'] as both would match and order matters
      .sort((a, b) => b.length - a.length)
  }

  const filePatterns = options.filePatterns
    ? isArray(options.filePatterns)
      ? options.filePatterns
      : [options.filePatterns]
    : DEFAULT_OPTIONS.filePatterns
  const exclude = options.exclude
    ? isArray(options.exclude)
      ? options.exclude
      : [options.exclude]
    : DEFAULT_OPTIONS.exclude

  return {
    ...DEFAULT_OPTIONS,
    ...options,
    experimental,
    routesFolder,
    filePatterns,
    exclude,
  }
}

/**
 * @internal
 */
export type ResolvedOptions = ReturnType<typeof resolveOptions>

/**
 * Merge all the possible extensions as an array of unique values
 * @param options - user provided options
 * @internal
 */
export function mergeAllExtensions(options: ResolvedOptions): string[] {
  const allExtensions = new Set(options.extensions)

  for (const routeOption of options.routesFolder) {
    if (routeOption.extensions) {
      const extensions = resolveOverridableOption(
        options.extensions,
        routeOption.extensions
      )
      for (const ext of extensions) {
        allExtensions.add(ext)
      }
    }
  }

  return Array.from(allExtensions.values())
}
