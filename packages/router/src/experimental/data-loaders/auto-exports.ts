import { createFilter } from 'unplugin-utils'
import type { Plugin } from 'vite'
import MagicString from 'magic-string'
import { findStaticImports, parseStaticImport } from 'mlly'
import { resolve } from 'pathe'
import { StringFilter, type UnpluginOptions } from 'unplugin'

export function extractLoadersToExport(
  code: string,
  filterPaths: (id: string) => boolean,
  root: string
): string[] {
  const imports = findStaticImports(code)
  const importNames = imports.flatMap(i => {
    const parsed = parseStaticImport(i)

    // since we run post-post, vite will add a leading slash to the specifier
    const specifier = resolve(
      root,
      parsed.specifier.startsWith('/')
        ? parsed.specifier.slice(1)
        : parsed.specifier
    )

    // bail out faster for anything that is not a data loader
    if (!filterPaths(specifier)) return []

    return [
      parsed.defaultImport,
      ...Object.values(parsed.namedImports || {}),
    ].filter((v): v is string => !!v && !v.startsWith('_'))
  })

  return importNames
}

const PLUGIN_NAME = 'vue-router:data-loaders-auto-export'

/**
 * {@link AutoExportLoaders} options.
 */
export interface AutoExportLoadersOptions {
  /**
   * Filter page components to apply the auto-export. Passed to `transform.filter.id`.
   */
  transformFilter: StringFilter

  /**
   * Globs to match the paths of the loaders.
   */
  loadersPathsGlobs: string | string[]

  /**
   * Root of the project. All paths are resolved relatively to this one.
   * @default `process.cwd()`
   */
  root?: string
}

/**
 * Vite Plugin to automatically export loaders from page components.
 *
 * @param options Options
 * @experimental - This API is experimental and can be changed in the future. It's used internally by `experimental.autoExportsDataLoaders`

 */
export function AutoExportLoaders({
  transformFilter,
  loadersPathsGlobs,
  root = process.cwd(),
}: AutoExportLoadersOptions): Plugin {
  const filterPaths = createFilter(loadersPathsGlobs)

  return {
    name: PLUGIN_NAME,
    transform: {
      order: 'post',
      filter: {
        id: transformFilter,
      },

      handler(code) {
        const loadersToExports = extractLoadersToExport(code, filterPaths, root)

        if (loadersToExports.length <= 0) return

        const s = new MagicString(code)
        s.append(
          `\nexport const __loaders = [\n${loadersToExports.join(',\n')}\n];\n`
        )

        return {
          code: s.toString(),
          map: s.generateMap(),
        }
      },
    },
  }
}

export function createAutoExportPlugin(
  options: AutoExportLoadersOptions
): UnpluginOptions {
  return {
    name: PLUGIN_NAME,
    // Cast needed due to Vite version differences in monorepo
    vite: AutoExportLoaders(options),
  }
}
