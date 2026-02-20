import { getLang } from '@vue-macros/common'
import { PrefixTree, type TreeNode } from '../core/tree'
import { ImportsMap, joinPath } from '../core/utils'
import { type ResolvedOptions } from '../options'
import { toStringLiteral, ts } from '../utils'
import {
  generatePathParamsOptions,
  generateParamParserOptions,
  ParamParsersMap,
} from './generateParamParsers'
import { generatePageImport, formatMeta } from './generateRouteRecords'

/**
 * Compare two score sub-arrays element by element.
 * Ported from pathParserRanker.ts compareScoreArray.
 */
function compareScoreArray(a: number[], b: number[]): number {
  let i = 0
  while (i < a.length && i < b.length) {
    const diff = b[i] - a[i]
    if (diff) return diff
    i++
  }

  // if the shorter array is a pure static segment, it should sort first
  // otherwise sort the longer segment first
  if (a.length < b.length) {
    return a.length === 1 && a[0] === 300 ? -1 : 1
  } else if (a.length > b.length) {
    return b.length === 1 && b[0] === 300 ? 1 : -1
  }

  return 0
}

function isLastScoreNegative(score: number[][]): boolean {
  const last = score[score.length - 1]
  return score.length > 0 && last[last.length - 1] < 0
}

/**
 * Compare two score arrays for sorting routes by priority.
 * Ported from pathParserRanker.ts comparePathParserScore.
 */
function compareRouteScore(a: number[][], b: number[][]): number {
  let i = 0
  while (i < a.length && i < b.length) {
    const comp = compareScoreArray(a[i], b[i])
    if (comp) return comp
    i++
  }

  // handle wildcard (splat) routes
  if (Math.abs(b.length - a.length) === 1) {
    if (isLastScoreNegative(a)) return 1
    if (isLastScoreNegative(b)) return -1
  }

  // more segments = more specific = sort first
  return b.length - a.length
}

interface GenerateRouteResolverState {
  id: number
  matchableRecords: {
    path: string
    varName: string
    score: number[][]
  }[]
  parsedPathCache?: Map<string, TreeNode>
}

interface ParentVariantContext {
  parentVar: string | null | undefined
  parentNode: TreeNode | null | undefined
  parentFullPath: string
  isAliasBranch: boolean
}

const ROUTE_RECORD_VAR_PREFIX = '__route_'

export function generateRouteResolver(
  tree: PrefixTree,
  options: ResolvedOptions,
  importsMap: ImportsMap,
  paramParsersMap: ParamParsersMap
): string {
  const state: GenerateRouteResolverState = {
    id: 0,
    matchableRecords: [],
    parsedPathCache: new Map(),
  }
  const records = tree.getChildrenSorted().map(node =>
    generateRouteRecord({
      node,
      parentContexts: [
        {
          parentVar: null,
          parentNode: null,
          parentFullPath: '',
          isAliasBranch: false,
        },
      ],
      state,
      options,
      importsMap,
      paramParsersMap,
    })
  )

  importsMap.add('vue-router/experimental', 'createFixedResolver')
  importsMap.add('vue-router/experimental', 'MatcherPatternPathStatic')
  importsMap.add('vue-router/experimental', 'MatcherPatternPathDynamic')
  importsMap.add('vue-router/experimental', 'normalizeRouteRecord')

  return ts`
${records.join('\n\n')}

export const resolver = createFixedResolver([
${state.matchableRecords
  .sort(
    (a, b) =>
      compareRouteScore(a.score, b.score) ||
      // fallback to sorting by path depth to ensure consistent order between routes with the same score
      b.path.split('/').filter(Boolean).length -
        a.path.split('/').filter(Boolean).length
  )
  .map(
    ({ varName, path }) =>
      `  ${varName},  ${' '.repeat(String(state.id).length - varName.length + ROUTE_RECORD_VAR_PREFIX.length)}// ${path}`
  )
  .join('\n')}
])
`
}

/**
 * Generates the route record in the format expected by the static resolver.
 */
export function generateRouteRecord({
  node,
  parentVar,
  parentNode,
  parentContexts,
  state,
  options,
  importsMap,
  paramParsersMap,
}: {
  node: TreeNode
  parentVar?: string | null | undefined
  parentNode?: TreeNode | null | undefined
  parentContexts?: ParentVariantContext[]
  state: GenerateRouteResolverState
  options: ResolvedOptions
  importsMap: ImportsMap
  paramParsersMap: ParamParsersMap
}): string {
  const isMatchable = node.isMatchable()
  const resolvedParentContexts: ParentVariantContext[] = parentContexts || [
    {
      parentVar,
      parentNode,
      parentFullPath: parentNode?.fullPath ?? node.parent?.fullPath ?? '',
      isAliasBranch: false,
    },
  ]

  // we want to skip adding routes that add no options (components, meta, props, etc)
  // that simplifies the generated tree
  const shouldSkipNode = !isMatchable && !node.meta && !node.hasComponents

  // Handle definePage imports
  const definePageDataList: string[] = []
  // TODO: optimize to only add the record merge when needed
  if (node.hasDefinePage) {
    for (const [name, filePath] of node.value.components) {
      const pageDataImport = `_definePage_${name}_${importsMap.size}`
      definePageDataList.push(pageDataImport)
      const lang = getLang(filePath)
      importsMap.addDefault(
        // TODO: apply the language used in the sfc
        `${filePath}?definePage&` +
          (lang === 'vue' ? 'vue&lang.tsx' : `lang.${lang}`),
        pageDataImport
      )
    }
  }

  const aliases = node.value.overrides.alias || []
  const declarations: string[] = []
  const childParentContexts: ParentVariantContext[] = []

  const createDeclaration = (varName: string, routeRecordObject: string) => {
    if (definePageDataList.length > 0) {
      return `
const ${varName} = normalizeRouteRecord(
  ${generateRouteRecordMerge(routeRecordObject, definePageDataList, importsMap)}
)
`
    }

    return `
const ${varName} = normalizeRouteRecord(${routeRecordObject})
`
      .trim()
      .split('\n')
      .filter(line => line.trimStart().length > 0)
      .join('\n')
  }

  if (shouldSkipNode) {
    for (const parentContext of resolvedParentContexts) {
      childParentContexts.push({
        ...parentContext,
        parentFullPath: resolveRoutePath(
          node.path,
          parentContext.parentFullPath
        ),
      })
    }
  } else {
    const recordComponents = generateRouteRecordComponent(
      node,
      '  ',
      options.importMode,
      importsMap
    )
    const queryProperty = generateRouteRecordQuery({
      node,
      importsMap,
      paramParsersMap,
    })
    const recordName = isMatchable
      ? `name: ${toStringLiteral(node.name)},`
      : node.name
        ? `/* (internal) name: ${toStringLiteral(node.name)} */`
        : `/* (removed) name: false */`

    let originalVarName: string | null = null

    for (const parentContext of resolvedParentContexts) {
      const currentFullPath = resolveRoutePath(
        node.path,
        parentContext.parentFullPath
      )
      const varName = `${ROUTE_RECORD_VAR_PREFIX}${state.id++}`
      if (!originalVarName) {
        originalVarName = varName
      }
      const aliasOfVar = varName === originalVarName ? null : originalVarName
      const pathCode = generateRouteRecordPathForVariant({
        node,
        fullPath: currentFullPath,
        parentContext,
        state,
        options,
        importsMap,
        paramParsersMap,
      })

      const routeRecordObject = `{
  ${recordName}
  ${pathCode}${queryProperty ? `\n  ${queryProperty}` : ''}${formatMeta(node, '  ')}
  ${recordComponents}${parentContext.parentVar ? `\n  parent: ${parentContext.parentVar},` : ''}${
    aliasOfVar ? `\n  aliasOf: ${aliasOfVar},` : ''
  }
}`
      declarations.push(createDeclaration(varName, routeRecordObject))

      if (isMatchable) {
        const matchableNode =
          !parentContext.isAliasBranch && currentFullPath === node.fullPath
            ? node
            : getParsedPathNode(currentFullPath, options, state)
        state.matchableRecords.push({
          path: matchableNode.fullPath,
          varName,
          score: matchableNode.score,
        })
      }

      childParentContexts.push({
        parentVar: varName,
        parentNode: node,
        parentFullPath: currentFullPath,
        isAliasBranch: aliasOfVar != null,
      })

      if (!isMatchable) {
        continue
      }

      for (const aliasPath of aliases) {
        const aliasVarName = `${ROUTE_RECORD_VAR_PREFIX}${state.id++}`
        const aliasFullPath = resolveRoutePath(
          aliasPath,
          parentContext.parentFullPath
        )
        const aliasNode = getParsedPathNode(aliasFullPath, options, state)
        const aliasPathCode =
          parentContext.parentVar &&
          aliasFullPath === parentContext.parentFullPath
            ? `path: ${parentContext.parentVar}.path,`
            : generatePathCode(
                aliasNode,
                importsMap,
                paramParsersMap,
                applySourceParamParsers(aliasNode.pathParams, node.pathParams)
              )

        const aliasRecordObject = `{
  ...${varName},
  ${aliasPathCode}
  aliasOf: ${originalVarName},
}`
        declarations.push(createDeclaration(aliasVarName, aliasRecordObject))

        state.matchableRecords.push({
          path: aliasNode.fullPath,
          varName: aliasVarName,
          score: aliasNode.score,
        })

        childParentContexts.push({
          parentVar: aliasVarName,
          parentNode: node,
          parentFullPath: aliasFullPath,
          isAliasBranch: true,
        })
      }
    }
  }

  const children = node.getChildrenSorted().map(child =>
    generateRouteRecord({
      node: child,
      parentContexts: childParentContexts,
      state,
      options,
      importsMap,
      paramParsersMap,
    })
  )

  const declarationsCode = declarations.join('\n')
  const childrenCode = children.filter(Boolean).join('\n')

  if (declarationsCode && childrenCode) {
    return `${declarationsCode}\n${childrenCode}`
  }

  return declarationsCode || childrenCode
}

function generateRouteRecordComponent(
  node: TreeNode,
  indentStr: string,
  importMode: ResolvedOptions['importMode'],
  importsMap: ImportsMap
): string {
  // avoid generating an empty components object
  if (!node.hasComponents) {
    return ''
  }

  const files = Array.from(node.value.components)
  return `components: {
${files
  .map(
    ([key, path]) =>
      `${indentStr + '  '}${toStringLiteral(key)}: ${generatePageImport(path, importMode, importsMap)}`
  )
  .join(',\n')}
${indentStr}},`
}

function resolveRoutePath(path: string, parentFullPath: string): string {
  return path.startsWith('/') ? path : joinPath(parentFullPath, path)
}

function getParsedPathNode(
  fullPath: string,
  options: ResolvedOptions,
  state: GenerateRouteResolverState
): TreeNode {
  const cache = (state.parsedPathCache ||= new Map())
  let parsedPathNode = cache.get(fullPath)
  if (!parsedPathNode) {
    const tempTree = new PrefixTree(options)
    parsedPathNode = tempTree.insertParsedPath(fullPath.replace(/^\//, ''))
    cache.set(fullPath, parsedPathNode)
  }
  return parsedPathNode
}

function applySourceParamParsers(
  params: TreeNode['pathParams'],
  sourceParams: TreeNode['pathParams']
): TreeNode['pathParams'] {
  if (!sourceParams.some(param => param.parser != null)) {
    return params
  }

  const sourceParsersByName = new Map<string, Array<string | null>>()
  for (const sourceParam of sourceParams) {
    const sourceParsers = sourceParsersByName.get(sourceParam.paramName) || []
    sourceParsers.push(sourceParam.parser)
    sourceParsersByName.set(sourceParam.paramName, sourceParsers)
  }

  const seenByName = new Map<string, number>()
  let hasChanges = false
  const paramsWithParsers = params.map(param => {
    const sourceParsers = sourceParsersByName.get(param.paramName)
    if (!sourceParsers) {
      return param
    }

    const sourceIndex = seenByName.get(param.paramName) ?? 0
    seenByName.set(param.paramName, sourceIndex + 1)

    const sourceParser = sourceParsers[sourceIndex]
    if (!sourceParser || sourceParser === param.parser) {
      return param
    }

    hasChanges = true
    return {
      ...param,
      parser: sourceParser,
    }
  })

  return hasChanges ? paramsWithParsers : params
}

/**
 * Generates the dynamic/static `path: ...` property from a TreeNode.
 */
function generatePathCode(
  node: Pick<
    TreeNode,
    | 'pathParams'
    | 'regexp'
    | 'matcherPatternPathDynamicParts'
    | 'isSplat'
    | 'fullPath'
  >,
  importsMap: ImportsMap,
  paramParsersMap: ParamParsersMap,
  params = node.pathParams
): string {
  if (params.length > 0) {
    return `path: new MatcherPatternPathDynamic(
    ${node.regexp},
    ${generatePathParamsOptions(params, importsMap, paramParsersMap)},
    ${JSON.stringify(node.matcherPatternPathDynamicParts)},
    ${node.isSplat ? 'null,' : '/* trailingSlash */'}
  ),`
  } else {
    return `path: new MatcherPatternPathStatic(${toStringLiteral(node.fullPath)}),`
  }
}

function generateRouteRecordPathForVariant({
  node,
  fullPath,
  parentContext,
  state,
  options,
  importsMap,
  paramParsersMap,
}: {
  node: TreeNode
  fullPath: string
  parentContext: ParentVariantContext
  state: GenerateRouteResolverState
  options: ResolvedOptions
  importsMap: ImportsMap
  paramParsersMap: ParamParsersMap
}): string {
  if (!node.isMatchable() && node.name) {
    return ''
  }

  // Keep the current code path for the original branch to preserve behavior
  // around index records and matcher reuse with parent nodes.
  if (!parentContext.isAliasBranch && fullPath === node.fullPath) {
    return generateRouteRecordPath({
      node,
      importsMap,
      paramParsersMap,
      parentVar: parentContext.parentVar,
      parentNode: parentContext.parentNode,
    })
  }

  if (parentContext.parentVar && fullPath === parentContext.parentFullPath) {
    return `path: ${parentContext.parentVar}.path,`
  }

  const parsedPathNode = getParsedPathNode(fullPath, options, state)
  return generatePathCode(
    parsedPathNode,
    importsMap,
    paramParsersMap,
    applySourceParamParsers(parsedPathNode.pathParams, node.pathParams)
  )
}

/**
 * Generates the `path` property of a route record for the static resolver.
 */
export function generateRouteRecordPath({
  node,
  importsMap,
  paramParsersMap,
  parentVar,
  parentNode,
}: {
  node: TreeNode
  importsMap: ImportsMap
  paramParsersMap: ParamParsersMap
  parentVar?: string | null | undefined
  parentNode?: TreeNode | null | undefined
}) {
  if (!node.isMatchable() && node.name) {
    return ''
  }

  // reuse the parent path matcher if it's exactly the same
  // this allows defining index pages and letting the router
  // recognize them by just checking the recorde.path === record.parent.path
  // it's used for active route matching
  // Compare against parentNode (which corresponds to parentVar) instead of node.parent
  if (parentVar && parentNode && node.regexp === parentNode.regexp) {
    return `path: ${parentVar}.path,`
  }

  return generatePathCode(node, importsMap, paramParsersMap)
}

/**
 * Generates the `query` property of a route record for the static resolver.
 */
export function generateRouteRecordQuery({
  node,
  importsMap,
  paramParsersMap,
}: {
  node: TreeNode
  importsMap: ImportsMap
  paramParsersMap: ParamParsersMap
}) {
  const queryParams = node.queryParams
  if (queryParams.length === 0) {
    return ''
  }

  importsMap.add('vue-router/experimental', 'MatcherPatternQueryParam')

  return `query: [
${queryParams
  .map(param => {
    const parserOptions = generateParamParserOptions(
      param,
      importsMap,
      paramParsersMap
    )

    const args = [
      `'${param.paramName}'`,
      // TODO: allow param.queryKey
      `'${param.paramName}'`,
      `'${param.format}'`,
    ]

    if (parserOptions || param.defaultValue !== undefined || param.required) {
      args.push(parserOptions || '{}')
    }

    if (param.defaultValue !== undefined || param.required) {
      args.push(param.defaultValue || 'undefined')
    }

    // we can strip any non true value to save bytes
    if (param.required) {
      args.push(String(param.required))
    }

    return `    new MatcherPatternQueryParam(${args.join(', ')})`
  })
  .join(',\n')}
  ],`
}

/**
 * Generates a merge call for route records with definePage data in the experimental resolver format.
 */
function generateRouteRecordMerge(
  routeRecordObject: string,
  definePageDataList: string[],
  importsMap: ImportsMap
): string {
  if (definePageDataList.length === 0) {
    return routeRecordObject
  }

  importsMap.add('vue-router/experimental', '_mergeRouteRecord')

  // Re-indent the route object to be 4 spaces (2 levels from normalizeRouteRecord)
  const indentedRouteObject = routeRecordObject
    .split('\n')
    .map(line => {
      return line && `    ${line}`
    })
    .join('\n')

  return `_mergeRouteRecord(
${indentedRouteObject},
${definePageDataList.map(name => `    ${name}`).join(',\n')}
  )`
}
