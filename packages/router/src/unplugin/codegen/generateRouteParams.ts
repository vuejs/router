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

function getHashDefaultType(defaultValue: string, parsedType?: string): string {
  const statement = babelParse(`(\n${defaultValue}\n)`, 'ts').body[0]
  if (statement?.type !== 'ExpressionStatement') return 'unknown'
  let expression = statement.expression
  if (
    expression.type === 'ArrowFunctionExpression' ||
    expression.type === 'FunctionExpression'
  ) {
    // Async and generator factories return wrappers, not their return values.
    if (
      expression.async ||
      expression.generator ||
      expression.params.length ||
      (expression.type === 'FunctionExpression' && expression.id)
    ) {
      return 'unknown'
    }
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
      return 'unknown'
    }
  }
  if (
    expression.type === 'ArrayExpression' ||
    expression.type === 'ObjectExpression'
  ) {
    return parsedType ?? 'unknown'
  }
  return getHashDefaultExpressionType(expression)
}

function getHashDefaultExpressionType(expression: Expression): string {
  switch (expression.type) {
    case 'NullLiteral':
      return 'null'
    case 'StringLiteral':
    case 'TemplateLiteral':
      return 'string'
    case 'BooleanLiteral':
      return 'boolean'
    case 'NumericLiteral':
      return 'number'
    case 'BigIntLiteral':
      return 'bigint'
    case 'Identifier':
      return expression.name === 'undefined' ? 'undefined' : 'unknown'
    case 'UnaryExpression':
      if (expression.operator === 'void') return 'undefined'
      if (expression.operator === '!') return 'boolean'
      if (expression.operator === '+') return 'number'
      if (expression.operator === '-' || expression.operator === '~') {
        const type = getHashDefaultExpressionType(expression.argument)
        return type === 'bigint' || type === 'number' ? type : 'number | bigint'
      }
      return 'unknown'
    case 'ConditionalExpression':
      return [
        ...new Set([
          getHashDefaultExpressionType(expression.consequent),
          getHashDefaultExpressionType(expression.alternate),
        ]),
      ].join(' | ')
    default:
      // Defaults can reference page-local bindings unavailable in the declaration.
      return 'unknown'
  }
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
            if (isLoose) {
              const navigationTypes = new Set([type])
              if (hasDefault) {
                const defaultType = getHashDefaultType(
                  param.defaultValue!,
                  param.parser && types[i] ? type : undefined
                )
                if (param.parser && types[i] != null) {
                  if (
                    defaultType.split(' | ').includes('null') ||
                    defaultType.split(' | ').includes('unknown')
                  ) {
                    navigationTypes.add('null')
                  }
                } else if (!defaultType.split(' | ').includes('unknown')) {
                  for (const member of defaultType.split(' | ')) {
                    if (member !== 'undefined') navigationTypes.add(member)
                  }
                }
              }
              if (isOptional) {
                navigationTypes.add('undefined')
              }
              type = [...navigationTypes].join(' | ')
            } else {
              if ((param.required || hasDefault) && type.startsWith('Param_')) {
                type = `Exclude<${type}, undefined>`
              }
              if (hasDefault) {
                const defaultType = getHashDefaultType(
                  param.defaultValue!,
                  param.parser && types[i] ? type : undefined
                )
                if (
                  defaultType.split(' | ').includes('unknown') &&
                  param.parser &&
                  types[i]
                ) {
                  // The default API constrains values and factories to the parser type.
                  type = `${types[i]} | null`
                } else if (defaultType !== type) {
                  type += ` | ${defaultType}`
                }
              } else if (!param.required) {
                type += ' | undefined'
              }
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

          return `${paramName}${
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
