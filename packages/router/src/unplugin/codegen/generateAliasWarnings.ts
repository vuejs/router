import type { PrefixTree } from '../core/tree'

/**
 * Generates runtime warnings for aliases that are not absolute paths.
 *
 * @param tree - prefix tree to scan
 *
 * @internal
 */
export function generateAliasWarnings(tree: PrefixTree): string {
  const warnings: string[] = []

  for (const node of tree.getChildrenDeepSorted()) {
    for (const alias of node.value.alias) {
      if (!alias.startsWith('/')) {
        warnings.push(
          `console.warn('[vue-router] Alias "${alias}" for route "${node.value.fullPath}" must be absolute (start with "/"). Relative aliases are not supported in file-based routing.')`
        )
      }
    }
  }

  return warnings.join('\n')
}
