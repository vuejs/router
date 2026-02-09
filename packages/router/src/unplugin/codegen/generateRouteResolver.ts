import { getLang } from '@vue-macros/common'
import { PrefixTree, type TreeNode } from '../core/tree'
import { ImportsMap } from '../core/utils'
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
}

const ROUTE_RECORD_VAR_PREFIX = '__route_'

export function generateRouteResolver(
  tree: PrefixTree,
  options: ResolvedOptions,
  importsMap: ImportsMap,
  paramParsersMap: ParamParsersMap
): string {
  const state: GenerateRouteResolverState = { id: 0, matchableRecords: [] }
  const records = tree.getChildrenSorted().map(node =>
    generateRouteRecord({
      node,
      parentVar: null,
      parentNode: null,
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
  state,
  options,
  importsMap,
  paramParsersMap,
}: {
  node: TreeNode
  parentVar: string | null | undefined
  parentNode: TreeNode | null | undefined
  state: GenerateRouteResolverState
  options: ResolvedOptions
  importsMap: ImportsMap
  paramParsersMap: ParamParsersMap
}): string {
  const isMatchable = node.isMatchable()

  // we want to skip adding routes that add no options (components, meta, props, etc)
  // that simplifies the generated tree
  const shouldSkipNode = !isMatchable && !node.meta && !node.hasComponents

  let varName: string | null = null
  let recordDeclaration = ''

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

  if (!shouldSkipNode) {
    varName = `${ROUTE_RECORD_VAR_PREFIX}${state.id++}`

    let recordName: string
    const recordComponents = generateRouteRecordComponent(
      node,
      '  ',
      options.importMode,
      importsMap
    )

    if (isMatchable) {
      state.matchableRecords.push({
        path: node.fullPath,
        varName,
        score: node.score,
      })
      recordName = `name: ${toStringLiteral(node.name)},`
    } else {
      recordName = node.name
        ? `/* (internal) name: ${toStringLiteral(node.name)} */`
        : `/* (removed) name: false */`
    }

    const queryProperty = generateRouteRecordQuery({
      node,
      importsMap,
      paramParsersMap,
    })
    const routeRecordObject = `{
  ${recordName}
  ${generateRouteRecordPath({ node, importsMap, paramParsersMap, parentVar, parentNode })}${
    queryProperty ? `\n  ${queryProperty}` : ''
  }${formatMeta(node, '  ')}
  ${recordComponents}${parentVar ? `\n  parent: ${parentVar},` : ''}
}`

    recordDeclaration =
      definePageDataList.length > 0
        ? `
const ${varName} = normalizeRouteRecord(
  ${generateRouteRecordMerge(routeRecordObject, definePageDataList, importsMap)}
)
`
        : `
const ${varName} = normalizeRouteRecord(${routeRecordObject})
`
            .trim()
            .split('\n')
            // remove empty lines
            .filter(l => l.trimStart().length > 0)
            .join('\n')
  }

  // Generate alias records for each alias path
  let aliasDeclarations = ''
  const aliases = node.value.overrides.alias
  if (varName && isMatchable && aliases && aliases.length > 0) {
    for (const aliasPath of aliases) {
      const aliasVarName = `${ROUTE_RECORD_VAR_PREFIX}${state.id++}`

      const tempTree = new PrefixTree(options)
      // FIXME: should always remove the first character since they all must start with a slash
      const strippedAlias = aliasPath.replace(/^\//, '')
      // TODO: allow the new file based syntax
      const tempNode = tempTree.insertParsedPath(strippedAlias)

      const aliasPathCode = generatePathCode(
        tempNode,
        importsMap,
        paramParsersMap
      )

      const aliasRecordObject = `{
  ...${varName},
  ${aliasPathCode}
  aliasOf: ${varName},
}`

      aliasDeclarations += `\nconst ${aliasVarName} = normalizeRouteRecord(${aliasRecordObject})`

      state.matchableRecords.push({
        path: tempNode.fullPath,
        varName: aliasVarName,
        score: tempNode.score,
      })
    }
  }

  const children = node.getChildrenSorted().map(child =>
    generateRouteRecord({
      node: child,
      // If we skipped this node, pass the parent var from above, otherwise use our var
      parentVar: shouldSkipNode ? parentVar : varName,
      // Track the actual node that parentVar represents
      parentNode: shouldSkipNode ? parentNode : node,
      state,
      options,
      importsMap,
      paramParsersMap,
    })
  )

  return (
    recordDeclaration +
    aliasDeclarations +
    (children.length
      ? (recordDeclaration || aliasDeclarations ? '\n' : '') +
        children.join('\n')
      : '')
  )
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

/**
 * Generates the dynamic/static `path: ...` property from a TreeNode.
 */
function generatePathCode(
  node: TreeNode,
  importsMap: ImportsMap,
  paramParsersMap: ParamParsersMap
): string {
  const params = node.pathParams
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
