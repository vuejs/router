import type { TreeNode } from '../core/tree'
import {
  isTreeParamOptional,
  isTreeParamRepeatable,
  isTreePathParam,
} from '../core/treeNodeValue'
import type { ParamParsersMap } from './generateParamParsers'
import { diagnostics } from '../diagnostics'

// TODO: simplify the generateRouteParams to not use the type helpers ParamValueOneOrMore, ParamValueZeroOrMore, ParamValueZeroOrOne, and ParamValue, just output raw unions like string | string[]
export function generateRouteParams(node: TreeNode, isRaw: boolean): string {
  // node.pathParams is a getter so we compute it once
  // this version does not support query params
  const nodeParams = node.pathParams
  return nodeParams.length > 0
    ? `{ ${nodeParams
        .filter(param => {
          if (!param.paramName) {
            diagnostics.VUE_ROUTER_B0017({
              fullPath: node.fullPath,
              path: node.path,
            })
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

/**
 * Enhanced version of `generateRouteParams` that supports both path and query
 * params, and also takes into account the types of the params and whether they
 * are defined with raw parsers.
 *
 * @internal
 *
 * @param node - The tree node for which to generate the route params type.
 * @param types - An array of types corresponding to the params in the node. The order should match the order of params in the node.
 * @param isLoose - Whether to generate the type that is accepted when pushing (more persmissive)
 * @param paramParsersMap - An optional map of param parsers, used to determine if a param is defined with a raw parser.
 * @returns A string representing the TypeScript type for the route params of the given node.
 */
export function EXPERIMENTAL_generateRouteParams(
  node: TreeNode,
  types: Array<string | null>,
  isLoose: boolean,
  paramParsersMap?: ParamParsersMap
) {
  // node.params is a getter so we compute it once
  const nodeParams = node.params
  return nodeParams.length > 0
    ? `{ ${nodeParams
        .map((param, i) => {
          const isOptional = isTreeParamOptional(param)
          const isRepeatable = isTreeParamRepeatable(param)

          const type = types[i]
          // if the param has a parser and is defined with defineParamParserRaw
          const isRawParser = !!(
            param.parser && paramParsersMap?.get(param.parser)?.isRaw
          )

          let extractedType: string

          if (type?.startsWith('Param_')) {
            extractedType = isRawParser
              ? `${type} /* raw param parser */`
              : isRepeatable
                ? `Extract<${type}, unknown[]>`
                : `Exclude<${type}, unknown[] | null>`
          } else {
            extractedType = `${type ?? 'string'}${isRepeatable ? '[]' : ''}`
          }

          // Track if this is an optional query param (no default, not required)
          let isOptionalQueryParam = false

          // Add | null for optional path params. Raw parsers are skipped since TParam is used as-is.
          if (isTreePathParam(param)) {
            if (isOptional && !isRepeatable && !isRawParser) {
              extractedType += ' | null'
            }
          } else {
            // Handle query params
            if (!param.required) {
              isOptionalQueryParam = true
              const hasNoDefault =
                param.defaultValue === undefined ||
                param.defaultValue === 'undefined'
              // For raw types (router.push), explicitly allow `undefined` so
              // the param is assignable even under `exactOptionalPropertyTypes`.
              // For non-raw types (route.params), only add `| undefined` when
              // the parser is not a raw parser: raw parsers always receive
              // the array form at runtime, so they never leave the value
              // undefined.
              if (hasNoDefault && (isLoose || !isRawParser)) {
                extractedType += ' | undefined'
              }
            }
          }

          return `${param.paramName}${
            // For raw types (router.push), use ? marker for optional query params
            // For non-raw types (route.params), the | undefined is explicit in the union
            isLoose && isOptionalQueryParam ? '?' : ''
          }: ${extractedType}`
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
