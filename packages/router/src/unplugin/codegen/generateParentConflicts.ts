import { collectParentConflicts, type PrefixTree } from '../core/tree'

/**
 * Generates runtime warnings for `_parent` conflicts.
 *
 * @param tree - prefix tree to scan
 *
 * @internal
 */
export function generateParentConflictWarnings(tree: PrefixTree): string {
  const conflicts = collectParentConflicts(tree)
  if (!conflicts.length) return ''

  return (
    '\n' +
    conflicts
      .map(
        ({ routePath, parentFilePath, filePath }) =>
          `console.warn('[vue-router] Conflicting parent components for route "${routePath}": "${parentFilePath}" and "${filePath}". Use only the "_parent" file.')`
      )
      .join('\n') +
    '\n'
  )
}
