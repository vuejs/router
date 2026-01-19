import { TreeNode } from '../core/tree'
import {
  isTreeParamOptional,
  isTreeParamRepeatable,
  isTreePathParam,
} from '../core/treeNodeValue'

export function generateRouteParams(node: TreeNode, isRaw: boolean): string {
  // node.pathParams is a getter so we compute it once
  // this version does not support query params
  const nodeParams = node.pathParams
  return nodeParams.length > 0
    ? `{ ${nodeParams
        .filter(param => {
          if (!param.paramName) {
            console.warn(
              `Warning: A parameter without a name was found in the route "${node.fullPath}" in segment "${node.path}".\n` +
                `‼️ This is a bug, please report it at https://github.com/vuejs/router`
            )
            return false
          }
          return true
        })
        .map(
          param =>
            `${param.paramName}${param.optional ? '?' : ''}: ` +
            (param.modifier === '+'
              ? `ParamValueOneOrMore<${isRaw}>`
              : param.modifier === '*'
                ? `ParamValueZeroOrMore<${isRaw}>`
                : param.modifier === '?'
                  ? `ParamValueZeroOrOne<${isRaw}>`
                  : `ParamValue<${isRaw}>`)
        )
        .join(', ')} }`
    : // no params allowed
      'Record<never, never>'
}

export function EXPERIMENTAL_generateRouteParams(
  node: TreeNode,
  types: Array<string | null>,
  isRaw: boolean
) {
  // node.params is a getter so we compute it once
  const nodeParams = node.params
  return nodeParams.length > 0
    ? `{ ${nodeParams
        .map((param, i) => {
          const isOptional = isTreeParamOptional(param)
          const isRepeatable = isTreeParamRepeatable(param)

          const type = types[i]

          let extractedType: string

          if (type?.startsWith('Param_')) {
            extractedType = `${isRepeatable ? 'Extract' : 'Exclude'}<${type}, unknown[]>`
          } else {
            extractedType = `${type ?? 'string'}${isRepeatable ? '[]' : ''}`
          }

          extractedType +=
            isTreePathParam(param) && isOptional && !isRepeatable
              ? ' | null'
              : ''

          return `${param.paramName}${isRaw && isOptional ? '?' : ''}: ${extractedType}`
        })
        .join(', ')} }`
    : // no params allowed
      'Record<never, never>'
}

// TODO: Remove in favor of inline types because it's easier to read

/**
 * Utility type for raw and non raw params like :id+
 *
 */
export type ParamValueOneOrMore<isRaw extends boolean> = [
  ParamValue<isRaw>,
  ...ParamValue<isRaw>[],
]

/**
 * Utility type for raw and non raw params like :id*
 *
 */
export type ParamValueZeroOrMore<isRaw extends boolean> = true extends isRaw
  ? ParamValue<isRaw>[] | undefined | null
  : ParamValue<isRaw>[] | undefined

/**
 * Utility type for raw and non raw params like :id?
 *
 */
export type ParamValueZeroOrOne<isRaw extends boolean> = true extends isRaw
  ? string | number | null | undefined
  : string

/**
 * Utility type for raw and non raw params like :id
 *
 */
export type ParamValue<isRaw extends boolean> = true extends isRaw
  ? string | number
  : string
