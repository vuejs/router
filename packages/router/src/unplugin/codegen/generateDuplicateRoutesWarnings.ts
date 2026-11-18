import { collectDuplicatedRouteNodes, type PrefixTree } from '../core/tree'
import { toStringLiteral } from '../utils'

/**
 * Generates runtime warnings for `_parent` conflicts.
 *
 * @param tree - prefix tree to scan
 *
 * @internal
 */
export function generateDuplicatedRoutesWarnings(tree: PrefixTree): string {
  const conflicts = collectDuplicatedRouteNodes(tree)
  if (!conflicts.length) return ''

  return conflicts
    .flatMap(
      conflicts =>
        `console.warn([${[
          `[vue-router] Conflicting files found for route "${conflicts.at(0)!.node.fullPath}":`,
          ...conflicts.map(({ filePath }) => `- ${filePath}`),
        ]
          .map(toStringLiteral)
          .join(', ')}].join('\\n'))`
    )
    .join('\n')
}
