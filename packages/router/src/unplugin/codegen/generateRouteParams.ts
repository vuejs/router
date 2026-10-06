import type { TreeNode } from '../core/tree'
import type { Expression } from '@babel/types'
import {
  isTreeParamOptional,
  hasTreeParamDefault,
  isTreeParamRepeatable,
  isTreePathParam,
  isTreeHashParam,
  type TreeParam,
  type TreePathParam,
} from '../core/treeNodeValue'
import type { ParamParsersMap } from './generateParamParsers'
import { diagnostics } from '../diagnostics'
import { toStringLiteral } from '../utils'
import { babelParse } from '@vue-macros/common'

const NON_NULL_EXPRESSIONS = new Set<Expression['type']>([
  'StringLiteral',
  'TemplateLiteral',
  'BooleanLiteral',
  'NumericLiteral',
  'BigIntLiteral',
  'UnaryExpression',
  'ArrayExpression',
  'ObjectExpression',
])

/**
 * `definePage()` constrains hash defaults to `T | null` or a factory of it,
 * so only a possible `null` widens the type. Unknown values, like page-local
 * bindings, are assumed to be nullable.
 */
function mayHashDefaultBeNull(defaultValue: string): boolean {
  const statement = babelParse(`(\n${defaultValue}\n)`, 'ts').body[0]
  if (statement?.type !== 'ExpressionStatement') return true
  let expression = statement.expression
  if (
    expression.type === 'ArrowFunctionExpression' ||
    expression.type === 'FunctionExpression'
  ) {
    const body = expression.body
    if (body.type !== 'BlockStatement') {
      expression = body
    } else if (
      body.body.length === 1 &&
      body.body[0]?.type === 'ReturnStatement' &&
      body.body[0].argument
    ) {
      expression = body.body[0].argument
    } else {
      return true
    }
  }
  return mayExpressionBeNull(expression)
}

function mayExpressionBeNull(expression: Expression): boolean {
  return expression.type === 'ConditionalExpression'
    ? mayExpressionBeNull(expression.consequent) ||
        mayExpressionBeNull(expression.alternate)
    : !NON_NULL_EXPRESSIONS.has(expression.type)
}

/**
 * Prepares params to be rendered as a type: params without a name are dropped
 * and reported as they would generate invalid types. A param can also be
 * declared more than once across the chain of records, and duplicated keys are
 * invalid in a type literal, so the deepest declaration wins like at runtime.
 * Params are then sorted by name to keep the generated types stable.
 *
 * @internal
 */
export function normalizeParamsForTypes<T extends TreeParam>(
  node: TreeNode,
  params: T[]
): T[] {
  // deduplicate by name, keeps the deepest declaration
  const byName = new Map<string, T>()
  for (const param of params) {
    // warn and skip invalid params without a name
    if (!param.paramName) {
      diagnostics.VUE_ROUTER_B0017({
        fullPath: node.fullPath,
        path: node.path,
      })
      continue
    }
    byName.set(param.paramName, param)
  }

  // to have cleaner git diffs, sort by paramName
  return Array.from(byName.values()).sort((a, b) =>
    a.paramName < b.paramName ? -1 : a.paramName > b.paramName ? 1 : 0
  )
}

// TODO: simplify the generateRouteParams to not use the type helpers ParamValueOneOrMore, ParamValueZeroOrMore, ParamValueZeroOrOne, and ParamValue, just output raw unions like string | string[]
/**
 * @param nodeParams - path params already normalized with `normalizeParamsForTypes()`. This version does not support query params.
 * @param isRaw - whether to generate the type accepted when pushing
 */
export function generateRouteParams(
  nodeParams: TreePathParam[],
  isRaw: boolean
): string {
  return nodeParams.length > 0
    ? `{ ${nodeParams
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
 * Enhanced version of `generateRouteParams` that supports path, query, and hash
 * params, and also takes into account the types of the params and whether they
 * are defined with raw parsers.
 *
 * @internal
 *
 * @param nodeParams - The params to generate the type for. Must be the same array passed to `generateParamsTypes()` since `types` is aligned with it by index.
 * @param types - An array of types corresponding to the params in the node. The order should match the order of params in the node.
 * @param isLoose - Whether to generate the type that is accepted when pushing (more persmissive)
 * @param paramParsersMap - An optional map of param parsers, used to determine if a param is defined with a raw parser.
 * @returns A string representing the TypeScript type for the route params of the given node.
 */
export function EXPERIMENTAL_generateRouteParams(
  nodeParams: TreeParam[],
  types: Array<string | null>,
  isLoose: boolean,
  paramParsersMap?: ParamParsersMap
) {
  return nodeParams.length > 0
    ? `{ ${nodeParams
        .map((param, i) => {
          const paramName = toStringLiteral(param.paramName)
          if (isTreeHashParam(param)) {
            const hasDefault = hasTreeParamDefault(param)
            const isOptional = isLoose && (!param.required || hasDefault)
            let type = types[i] ?? 'string'
            if (
              !isLoose &&
              (param.required || hasDefault) &&
              type.startsWith('Param_')
            ) {
              type = `Exclude<${type}, undefined>`
            }
            if (hasDefault && mayHashDefaultBeNull(param.defaultValue!)) {
              type += ' | null'
            }
            if (isLoose ? isOptional : !hasDefault && !param.required) {
              type += ' | undefined'
            }
            return `${paramName}${isOptional ? '?' : ''}: ${type}`
          }

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

          if (isTreePathParam(param)) {
            // Raw parsers are skipped since TParam is used as-is.
            if (isOptional && !isRepeatable && !isRawParser) {
              extractedType += ' | null'
            }
            return `${paramName}: ${extractedType}`
          }

          // Raw parsers always receive the array form at runtime, so they
          // never leave route.params undefined. Pushing still accepts it under
          // `exactOptionalPropertyTypes`.
          if (
            !param.required &&
            !hasTreeParamDefault(param) &&
            (isLoose || !isRawParser)
          ) {
            extractedType += ' | undefined'
          }
          return `${paramName}${isLoose && isOptional ? '?' : ''}: ${extractedType}`
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
