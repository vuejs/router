import type { TreeNode, TreeNodeNamed } from '../core/tree'
import type { ResolvedOptions } from '../options'
import { generateParamsTypes, ParamParsersMap } from './generateParamParsers'
import {
  EXPERIMENTAL_generateRouteParams,
  generateRouteParams,
} from './generateRouteParams'
import { pad, formatMultilineUnion, stringToStringType } from '../utils'

export function generateRouteNamedMap(
  node: TreeNode,
  options: ResolvedOptions,
  paramParsersMap: ParamParsersMap
): string {
  if (node.isRoot()) {
    return `export interface RouteNamedMap {
${node
  .getChildrenSorted()
  .map(n => generateRouteNamedMap(n, options, paramParsersMap))
  .join('')}}`
  }

  return (
    // if the node has a filePath, it's a component, it has a routeName and it should be referenced in the RouteNamedMap
    // otherwise it should be skipped to avoid navigating to a route that doesn't render anything
    (node.value.components.size && node.isNamed()
      ? pad(
          2,
          `${stringToStringType(node.name)}: ${generateRouteRecordInfo(node, options, paramParsersMap)},\n`
        )
      : '') +
    (node.children.size > 0
      ? node
          .getChildrenSorted()
          .map(n => generateRouteNamedMap(n, options, paramParsersMap))
          .join('\n')
      : '')
  )
}

export function generateRouteRecordInfo(
  node: TreeNodeNamed,
  options: ResolvedOptions,
  paramParsersMap: ParamParsersMap
): string {
  let paramParsers: Array<string | null> = []
  if (options.experimental.paramParsers) {
    paramParsers = generateParamsTypes(node.params, paramParsersMap)
  }

  const typeParams = [
    stringToStringType(node.name),
    stringToStringType(node.fullPath),
    options.experimental.paramParsers
      ? EXPERIMENTAL_generateRouteParams(node, paramParsers, true)
      : generateRouteParams(node, true),
    options.experimental.paramParsers
      ? EXPERIMENTAL_generateRouteParams(node, paramParsers, false)
      : generateRouteParams(node, false),
  ]

  const childRouteNames: string[] =
    node.children.size > 0
      ? // TODO: remove Array.from() once Node 20 support is dropped
        Array.from(node.getChildrenDeep())
          // skip routes that are not added to the types
          .reduce<string[]>((acc, childRoute) => {
            if (childRoute.value.components.size && childRoute.isNamed()) {
              acc.push(childRoute.name)
            }
            return acc
          }, [])
          .sort()
      : []

  typeParams.push(
    formatMultilineUnion(childRouteNames.map(stringToStringType), 4)
  )

  return `RouteRecordInfo<
${typeParams.map(line => pad(4, line)).join(',\n')}
  >`
}
