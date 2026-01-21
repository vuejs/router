import { TreePathParam, TreeQueryParam } from '../core/treeNodeValue'
import { ImportsMap } from '../core/utils'
import { PrefixTree } from '../core/tree'

export type ParamParsersMap = Map<
  string,
  {
    name: string
    typeName: `Param_${string}`
    relativePath: string
    absolutePath: string
  }
>

// just for type strictness
const _NATIVE_PARAM_PARSERS = ['int', 'bool'] as const
const NATIVE_PARAM_PARSERS = _NATIVE_PARAM_PARSERS as readonly string[]
const NATIVE_PARAM_PARSERS_TYPES = {
  int: 'number',
  bool: 'boolean',
} satisfies Record<(typeof _NATIVE_PARAM_PARSERS)[number], string>

export function warnMissingParamParsers(
  tree: PrefixTree,
  paramParsers: ParamParsersMap
) {
  for (const node of tree.getChildrenDeepSorted()) {
    for (const param of node.params) {
      if (param.parser && !paramParsers.has(param.parser)) {
        if (!NATIVE_PARAM_PARSERS.includes(param.parser)) {
          console.warn(
            `Parameter parser "${param.parser}" not found for route "${node.fullPath}".`
          )
        }
      }
    }
  }
}

export function generateParamParsersTypesDeclarations(
  paramParsers: ParamParsersMap
) {
  return Array.from(paramParsers.values())
    .map(({ typeName, relativePath }) => {
      const importPath = relativePath.startsWith('.')
        ? relativePath
        : './' + relativePath
      return `type ${typeName} = ReturnType<NonNullable<typeof import('${importPath}').parser['get']>>`
    })
    .join('\n')
}

export function generateParamsTypes(
  params: (TreePathParam | TreeQueryParam)[],
  parparsersMap: ParamParsersMap
): Array<string | null> {
  return params.map(param => {
    if (param.parser) {
      if (parparsersMap.has(param.parser)) {
        return parparsersMap.get(param.parser)!.typeName
      } else if (param.parser in NATIVE_PARAM_PARSERS_TYPES) {
        return NATIVE_PARAM_PARSERS_TYPES[
          param.parser as keyof typeof NATIVE_PARAM_PARSERS_TYPES
        ]
      }
    }
    return null
  })
}

export function generateParamParserOptions(
  param: TreePathParam | TreeQueryParam,
  importsMap: ImportsMap,
  paramParsers: ParamParsersMap
): string {
  if (!param.parser) return ''

  // we prioritize custom parsers to let users override them
  if (paramParsers.has(param.parser)) {
    const { name, absolutePath } = paramParsers.get(param.parser)!
    const varName = `PARAM_PARSER__${name}`
    importsMap.add(absolutePath, { name: 'parser', as: varName })
    return varName
  } else if (NATIVE_PARAM_PARSERS.includes(param.parser)) {
    const varName = `PARAM_PARSER_${param.parser.toUpperCase()}`
    importsMap.add('vue-router/experimental', varName)
    return varName
  }
  return ''
}

export function generateParamParserCustomType(
  paramParsers: ParamParsersMap
): string {
  const parserNames = Array.from(paramParsers.keys()).sort()

  if (parserNames.length === 0) {
    return 'never'
  }

  if (parserNames.length === 1) {
    return `'${parserNames[0]}'`
  }

  return parserNames.map(name => `  | '${name}'`).join('\n')
}

export function generatePathParamsOptions(
  params: TreePathParam[],
  importsMap: ImportsMap,
  paramParsers: ParamParsersMap
) {
  const paramOptions = params.map(param => {
    // build a lean option list without any optional value
    const optionList: string[] = []
    const parser = generateParamParserOptions(param, importsMap, paramParsers)
    optionList.push(parser || `/* no parser */`)
    if (param.optional || param.repeatable) {
      optionList.push(
        `/* repeatable: ` + (param.repeatable ? `*/ true` : `false */`)
      )
    }
    if (param.optional) {
      optionList.push(
        `/* optional: ` + (param.optional ? `*/ true` : `false */`)
      )
    }
    return `
${param.paramName}: [${optionList.join(', ')}],
`.slice(1, -1)
  })

  return paramOptions.length === 0
    ? '{}'
    : `{
      ${paramOptions.join('\n      ')}
    }`
}
