import { type FSWatcher, watch as fsWatch } from 'chokidar'
import picomatch from 'picomatch'
import { resolve } from 'pathe'
import {
  ResolvedOptions,
  RoutesFolderOption,
  RoutesFolderOptionResolved,
  _OverridableOption,
} from '../options'
import { appendExtensionListToPattern, asRoutePath } from './utils'
import path from 'pathe'

// TODO: export an implementable interface to create a watcher and let users provide a different watcher than chokidar to improve performance on windows

export class RoutesFolderWatcher {
  src: string
  path: string | ((filepath: string) => string)
  extensions: string[]
  filePatterns: string[]
  exclude: string[]

  watcher: FSWatcher

  constructor(folderOptions: RoutesFolderOptionResolved) {
    this.src = folderOptions.src
    this.path = folderOptions.path
    this.exclude = folderOptions.exclude
    this.extensions = folderOptions.extensions
    // the pattern includes the extenions, so we leverage picomatch check
    this.filePatterns = folderOptions.pattern

    const isMatch = picomatch(this.filePatterns, {
      ignore: this.exclude,
      // it seems like cwd isn't used by picomatch
      // so we need to use path.relative to get the relative path
      // cwd: this.src,
    })

    this.watcher = fsWatch('.', {
      cwd: this.src,
      ignoreInitial: true,
      ignorePermissionErrors: true,
      // usePolling: !!process.env.CI,
      // interval: process.env.CI ? 100 : undefined,
      awaitWriteFinish: !!process.env.CI,
      ignored: (filePath, stats) => {
        // let folders pass, they are ignored by the glob pattern
        if (!stats || stats.isDirectory()) {
          return false
        }

        return !isMatch(path.relative(this.src, filePath))
      },

      // TODO: allow user options
    })
  }

  on(
    event: 'add' | 'change' | 'unlink' | 'unlinkDir',
    handler: (context: HandlerContext) => void
  ) {
    this.watcher.on(event, (filePath: string) => {
      // console.log('📦 Event', event, filePath)

      // ensure consistent absolute path for Windows and Unix
      filePath = resolve(this.src, filePath)

      handler({
        filePath,
        routePath: asRoutePath(
          {
            src: this.src,
            path: this.path,
            extensions: this.extensions,
          },
          filePath
        ),
      })
    })
    return this
  }

  close() {
    return this.watcher.close()
  }
}

export interface HandlerContext {
  // resolved path
  filePath: string
  // routePath
  routePath: string
}

export function resolveFolderOptions(
  globalOptions: ResolvedOptions,
  folderOptions: RoutesFolderOption
): RoutesFolderOptionResolved {
  const extensions = overrideOption(
    globalOptions.extensions,
    folderOptions.extensions
  )
  const filePatterns = overrideOption(
    globalOptions.filePatterns,
    folderOptions.filePatterns
  )

  return {
    src: path.resolve(globalOptions.root, folderOptions.src),
    pattern: appendExtensionListToPattern(
      filePatterns,
      // also override the extensions if the folder has a custom extensions
      extensions
    ),
    path: folderOptions.path || '',
    extensions,
    filePatterns,
    exclude: overrideOption(globalOptions.exclude, folderOptions.exclude).map(
      p => (p.startsWith('**') ? p : resolve(p))
    ),
  }
}

function overrideOption(
  existing: string[] | string,
  newValue: undefined | string[] | string | ((existing: string[]) => string[])
): string[] {
  const asArray = typeof existing === 'string' ? [existing] : existing
  // allow extending when a function is passed
  if (typeof newValue === 'function') {
    return newValue(asArray)
  }
  // override if passed
  if (typeof newValue !== 'undefined') {
    return typeof newValue === 'string' ? [newValue] : newValue
  }
  // fallback to existing
  return asArray
}
