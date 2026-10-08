import { getLang } from '@vue-macros/common'
import { PrefixTree, type TreeNode } from '../core/tree'
import type { ImportsMap } from '../core/utils'
import { type ResolvedOptions } from '../options'
import { encodeImportIdentifierPart, toStringLiteral, ts } from '../utils'
import type { ParamParsersMap } from './generateParamParsers'
import {
  generatePathParamsOptions,
  generateParamParserOptions,
  generateNormalizedParamParsersDeclarations,
  collectUsedParamParserNames,
} from './generateParamParsers'
import { generatePageImport, formatMeta } from './generateRouteRecords'
import {
  comparePathScore,
  getPathScore,
  type PathScore,
} from '../../experimental/route-resolver/matchers/path-score'

/**
 * Number of nodes from the root to this node.
 */
function getNodeDepth(node: TreeNode): number {
  let depth = 0
  for (let n: TreeNode | undefined = node; n && !n.isRoot(); n = n.parent) {
    depth++
  }
  return depth
}

/**
 * Score of a node, computed like the runtime does from the generated pattern.
 */
function getNodeScore(node: TreeNode): PathScore {
  return getPathScore(
    node.matcherPatternPathDynamicParts,
    node.pathParams.map(param => [null, param.repeatable, param.optional])
  )
}

interface GenerateRouteResolverState {
  id: number
  matchableRecords: {
    path: string
    varName: string
    score: PathScore
    depth: number
  }[]
}

const ROUTE_RECORD_VAR_PREFIX = '__route_'

export function generateRouteResolver(
  tree: PrefixTree,
  options: ResolvedOptions,
  importsMap: ImportsMap,
  paramParsersMap: ParamParsersMap,
  { dynamic = false }: { dynamic?: boolean } = {}
): string {
  // restrict imports + normalized declarations to parsers actually referenced
  // by a route, so unused parser files don't get pulled into the bundle
  const usedParserNames = collectUsedParamParserNames(tree)
  const usedParamParsersMap: ParamParsersMap = new Map(
    Array.from(paramParsersMap).filter(([key]) => usedParserNames.has(key))
  )

  const state: GenerateRouteResolverState = { id: 0, matchableRecords: [] }
  const records = tree.getChildrenSorted().map(node =>
    generateRouteRecord({
      node,
      parentVar: null,
      parentNode: null,
      state,
      options,
      importsMap,
      paramParsersMap: usedParamParsersMap,
    })
  )

  // the dynamic resolver also ranks records at runtime, with the same score
  const createResolver = dynamic
    ? 'createDynamicResolver'
    : 'createFixedResolver'
  importsMap.add('vue-router/experimental', createResolver)
  importsMap.add('vue-router/experimental', 'MatcherPatternPathStatic')
  importsMap.add('vue-router/experimental', 'MatcherPatternPathDynamic')
  importsMap.add('vue-router/experimental', 'normalizeRouteRecord')

  const normalizedDeclarations = generateNormalizedParamParsersDeclarations(
    usedParamParsersMap,
    importsMap
  )

  return ts`
${normalizedDeclarations ? normalizedDeclarations + '\n\n' : ''}${records.join('\n\n')}

export const resolver = ${createResolver}([
${state.matchableRecords
  .sort(
    (a, b) =>
      comparePathScore(a.score, b.score) ||
      // descendants before ancestors, like the dynamic resolver
      b.depth - a.depth ||
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
  if (node.needsDefinePageImport) {
    for (const [name, filePath] of node.value.components) {
      if (!node.fileNeedsDefinePageImport(filePath)) continue
      const pageDataImport = `_definePage_${encodeImportIdentifierPart(name)}_${importsMap.size}`
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
        score: getNodeScore(node),
        depth: getNodeDepth(node),
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
    const hashProperty = generateRouteRecordHash({
      node,
      importsMap,
      paramParsersMap,
    })
    const routeRecordObject = `{
  ${recordName}
  ${generateRouteRecordPath({ node, importsMap, paramParsersMap, parentVar, parentNode })}${
    queryProperty ? `\n  ${queryProperty}` : ''
  }${hashProperty ? `\n  ${hashProperty}` : ''}${formatMeta(node, '  ')}
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
        score: getNodeScore(tempNode),
        depth: getNodeDepth(node),
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
    ${node.endsWithSplat ? 'null,' : '/* trailingSlash */'}
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
  // each record only declares its own query params: the resolver matches the
  // whole chain of records and merges them
  const queryParams = node.value.queryParams
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

    // raw parsers receive the URL value as-is, so force array format to
    // guarantee they see the full set of values for the key.
    const isRawParser = !!(
      param.parser && paramParsersMap.get(param.parser)?.isRaw
    )
    const invalidFormatWarn =
      isRawParser &&
      param.format === 'value' &&
      `console.warn(${toStringLiteral(`Query param "${param.paramName}" in route "${node.fullPath}" uses raw param parser "${param.parser}" but specifies \`format: 'value'\`. The format is ignored because raw parsers always receive the array form. Set it to 'array' to silence the warning.`)}) ||`

    const format = isRawParser ? 'array' : param.format || 'value'

    const args = [
      toStringLiteral(param.paramName),
      // TODO: allow param.queryKey
      toStringLiteral(param.paramName),
      toStringLiteral(format),
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

    return `    ${invalidFormatWarn || ''}new MatcherPatternQueryParam(${args.join(', ')})`
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

export function generateRouteRecordHash({
  node,
  importsMap,
  paramParsersMap,
}: {
  node: TreeNode
  importsMap: ImportsMap
  paramParsersMap: ParamParsersMap
}): string {
  const param = node.value.hashParams[0]
  if (!param) return ''

  importsMap.add('vue-router/experimental', 'MatcherPatternHashParam')
  const parser = generateParamParserOptions(param, importsMap, paramParsersMap)
  const args = [toStringLiteral(param.paramName)]
  if (parser || param.defaultValue !== undefined || param.required) {
    args.push(parser || '{}')
  }
  if (param.defaultValue !== undefined || param.required) {
    args.push(param.defaultValue ?? 'undefined')
  }
  if (param.required) args.push('true')
  return `hash: new MatcherPatternHashParam(${args.join(', ')}),`
}
