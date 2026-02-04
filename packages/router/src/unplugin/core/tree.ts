import { type ResolvedOptions } from '../options'
import {
  createTreeNodeValue,
  escapeRegex,
  type TreeNodeValueOptions,
  type TreePathParam,
  type TreeQueryParam,
} from './treeNodeValue'
import type { TreeNodeValue } from './treeNodeValue'
import type { CustomRouteBlock } from './customBlock'
import { ESCAPED_TRAILING_SLASH_RE } from './utils'
import type { RouteMeta } from '../../types'

export interface TreeNodeOptions extends ResolvedOptions {
  treeNodeOptions?: TreeNodeValueOptions
}

/**
 * Parts used by MatcherPatternPathDynamic to match a route.
 *
 * @internal
 */
export type TreeNodeValueMatcherPart = Array<
  string | number | Array<string | number>
>

/**
 * Makes the `name` property required and a string. Used for readability
 *
 * @internal
 */
export type TreeNodeNamed = TreeNode & {
  name: Extract<TreeNode['name'], string>
}

export class TreeNode {
  /**
   * value of the node
   */
  value: TreeNodeValue

  /**
   * children of the node
   */
  children: Map<string, TreeNode> = new Map()

  /**
   * Parent node.
   */
  parent: TreeNode | undefined

  /**
   * Plugin options taken into account by the tree.
   */
  options: TreeNodeOptions

  // FIXME: refactor this code. It currently helps to keep track if a page has at least one component with `definePage()` but it doesn't tell which. It should keep track of which one while still caching the result per file.
  /**
   * Should this page import the page info
   */
  hasDefinePage: boolean = false

  /**
   * Creates a new tree node.
   *
   * @param options - TreeNodeOptions shared by all nodes
   * @param pathSegment - path segment of this node e.g. `users` or `:id`
   * @param parent
   */
  constructor(
    options: TreeNodeOptions,
    pathSegment: string,
    parent?: TreeNode
  ) {
    this.options = options
    this.parent = parent
    this.value = createTreeNodeValue(
      pathSegment,
      parent?.value,
      options.treeNodeOptions || options.pathParser
    )
  }

  /**
   * Adds a path to the tree. `path` cannot start with a `/`.
   *
   * @param path - path segment to insert. **It shouldn't contain the file extension**
   * @param filePath - file path, must be a file (not a folder)
   */
  insert(path: string, filePath: string): TreeNode {
    const { tail, segment, viewName } = splitFilePath(path)

    // Handle _parent convention: _parent.vue sets component on current node
    if (segment === '_parent' && !tail) {
      this.value.setOverride(filePath, { name: false })
      this.value.components.set(viewName, filePath)
      return this
    }

    if (!this.children.has(segment)) {
      this.children.set(segment, new TreeNode(this.options, segment, this))
    } // TODO: else error or still override?
    const child = this.children.get(segment)!

    // we reached the end of the filePath, therefore it's a component
    if (!tail) {
      child.value.components.set(viewName, filePath)
    } else {
      return child.insert(tail, filePath)
    }
    return child
  }

  /**
   * Adds a path that has already been parsed to the tree. `path` cannot start with a `/`. This method is similar to
   * `insert` but the path argument should be already parsed. e.g. `users/:id` for a file named `users/[id].vue`.
   *
   * @param path - path segment to insert, already parsed (e.g. users/:id)
   * @param filePath - file path, defaults to path for convenience and testing
   */
  insertParsedPath(path: string, filePath: string = path): TreeNode {
    // TODO: allow null filePath?
    const isComponent = true

    const node = new TreeNode(
      {
        ...this.options,
        // force the format to raw
        treeNodeOptions: {
          ...this.options.pathParser,
          format: 'path',
        },
      },
      path,
      this
    )
    this.children.set(path, node)

    if (isComponent) {
      // TODO: allow a way to set the view name
      node.value.components.set('default', filePath)
    }

    return node
  }

  /**
   * Saves a custom route block for a specific file path. The file path is used as a key. Some special file paths will
   * have a lower or higher priority.
   *
   * @param filePath - file path where the custom block is located
   * @param routeBlock - custom block to set
   */
  setCustomRouteBlock(
    filePath: string,
    routeBlock: CustomRouteBlock | undefined
  ) {
    this.value.setOverride(filePath, routeBlock)
  }

  /**
   * Generator that yields all descendants without sorting.
   * Use with Array.from() for now, native .map() support in Node 22+.
   */
  *getChildrenDeep(): Generator<TreeNode> {
    for (const child of this.children.values()) {
      yield child
      yield* child.getChildrenDeep()
    }
  }

  /**
   * Comparator function for sorting TreeNodes.
   *
   * @internal
   */
  static compare(a: TreeNode, b: TreeNode): number {
    // for this case, ASCII, short list, it's better than Internation Collator
    // https://stackoverflow.com/questions/77246375/why-localecompare-can-be-faster-than-collator-compare
    return a.path.localeCompare(b.path, 'en')
  }

  /**
   * Get the children of this node sorted by their path.
   */
  getChildrenSorted(): TreeNode[] {
    return Array.from(this.children.values()).sort(TreeNode.compare)
  }

  /**
   * Calls {@link getChildrenDeep} and sorts the result by path in the end.
   */
  getChildrenDeepSorted(): TreeNode[] {
    return Array.from(this.getChildrenDeep()).sort(TreeNode.compare)
  }

  /**
   * Delete and detach itself from the tree.
   */
  delete() {
    if (!this.parent) {
      throw new Error('Cannot delete the root node.')
    }
    this.parent.children.delete(this.value.rawSegment)
    // clear link to parent
    this.parent = undefined
  }

  /**
   * Remove a route from the tree. The path shouldn't start with a `/` but it can be a nested one. e.g. `foo/bar`.
   * The `path` should be relative to the page folder.
   *
   * @param path - path segment of the file
   */
  remove(path: string) {
    // TODO: rename remove to removeChild
    const { tail, segment, viewName } = splitFilePath(path)

    // Handle _parent convention: remove component from current node
    if (segment === '_parent' && !tail) {
      this.value.components.delete(viewName)
      return
    }

    const child = this.children.get(segment)
    if (!child) {
      throw new Error(
        `Cannot Delete "${path}". "${segment}" not found at "${this.path}".`
      )
    }

    if (tail) {
      child.remove(tail)
      // if the child doesn't create any route
      if (child.children.size === 0 && child.value.components.size === 0) {
        this.children.delete(segment)
      }
    } else {
      // it can only be component because we only listen for removed files, not folders
      child.value.components.delete(viewName)
      // this is the file we wanted to remove
      if (child.children.size === 0 && child.value.components.size === 0) {
        this.children.delete(segment)
      }
    }
  }

  /**
   * Returns the route path of the node without parent paths. If the path was overridden, it returns the override.
   */
  get path() {
    return (
      this.value.overrides.path ??
      (this.parent?.isRoot() ? '/' : '') + this.value.pathSegment
    )
  }

  /**
   * Returns the route path of the node including parent paths.
   */
  get fullPath() {
    return this.value.fullPath
  }

  /**
   * Object of components (filepaths) for this node.
   */
  get components() {
    return Object.fromEntries(this.value.components.entries())
  }

  /**
   * Does this node render any component?
   */
  get hasComponents() {
    return this.value.components.size > 0
  }

  /**
   * Returns the route name of the node. If the name was overridden, it returns the override.
   */
  get name() {
    const overrideName = this.value.overrides.name
    // allows passing a null or empty name so the route is not named
    // and isn't listed in the route map
    return overrideName === undefined
      ? this.options.getRouteName(this)
      : overrideName
  }

  /**
   * Returns the meta property as an object.
   */
  get metaAsObject(): Readonly<RouteMeta> {
    return {
      ...this.value.overrides.meta,
    }
  }

  /**
   * Returns the JSON string of the meta object of the node. If the meta was overridden, it returns the override. If
   * there is no override, it returns an empty string.
   */
  get meta() {
    const overrideMeta = this.metaAsObject

    return Object.keys(overrideMeta).length > 0
      ? JSON.stringify(overrideMeta, null, 2)
      : ''
  }

  /**
   * Array of route params for this node. It includes **all** the params from the parents as well.
   */
  get params(): (TreePathParam | TreeQueryParam)[] {
    const params = [...this.value.params]
    let node = this.parent
    // add all the params from the parents
    while (node) {
      params.unshift(...node.value.params)
      node = node.parent
    }

    return params
  }

  /**
   * Array of route params coming from the path. It includes all the params from the parents as well.
   */
  get pathParams(): TreePathParam[] {
    const params = this.value.isParam() ? [...this.value.pathParams] : []
    let node = this.parent
    // add all the params from the parents
    while (node) {
      if (node.value.isParam()) {
        params.unshift(...node.value.pathParams)
      }
      node = node.parent
    }

    return params
  }

  /**
   * Array of query params extracted from definePage. Only returns query params from this specific node.
   */
  get queryParams(): TreeQueryParam[] {
    return this.value.queryParams
  }

  /**
   * Generates a regexp based on this node and its parents. This regexp is used by the custom resolver
   */
  get regexp(): string {
    let node: TreeNode | undefined = this
    // we build the node list from parent to child
    const nodeList: TreeNode[] = []
    while (node && !node.isRoot()) {
      nodeList.unshift(node)
      node = node.parent
    }

    let re = ''
    for (var i = 0; i < nodeList.length; i++) {
      node = nodeList[i]!
      if (node.value.isParam()) {
        var nodeRe = node.value.re
        // Ensure we add a connecting slash
        // if we already have something in the regexp and if the only part of
        // the segment is an optional param, then the / must be put inside the
        // non-capturing group
        if (
          // if we have a segment before or after
          (re || i < nodeList.length - 1) &&
          // if the only part of the segment is an optional (can be repeatable) param
          node.value.subSegments.length === 1 &&
          (node.value.subSegments.at(0) as TreePathParam).optional
        ) {
          // TODO: tweak if trailingSlash
          re += `(?:\\/${
            // we remove the ? at the end because we add it later
            nodeRe.slice(0, -1)
          })?`
        } else {
          re += (re ? '\\/' : '') + nodeRe
        }
      } else {
        re += (re ? '\\/' : '') + escapeRegex(node.value.pathSegment)
      }
    }

    return (
      '/^' +
      // Avoid adding a leading slash if the first segment
      // is an optional segment that already includes it
      (re.startsWith('(?:\\/') ? '' : '\\/') +
      // TODO: trailingSlash
      re.replace(ESCAPED_TRAILING_SLASH_RE, '') +
      '$/i'
    )
  }

  /**
   * Score of the path used for sorting routes.
   */
  get score(): number[][] {
    const scores: number[][] = []
    let node: TreeNode | undefined = this

    while (node && !node.isRoot()) {
      scores.unshift(node.value.score)
      node = node.parent
    }

    return scores
  }

  /**
   * Is this node a splat (catch-all) param
   */
  get isSplat(): boolean {
    return this.value.isParam() && this.value.pathParams.some(p => p.isSplat)
  }

  /**
   * Returns an array of matcher parts that is consumed by
   * MatcherPatternPathDynamic to render the path.
   */
  get matcherPatternPathDynamicParts(): TreeNodeValueMatcherPart {
    const parts: TreeNodeValueMatcherPart = []
    let node: TreeNode | undefined = this

    while (node && !node.isRoot()) {
      const subSegments = node.value.subSegments.map(segment =>
        typeof segment === 'string'
          ? segment
          : // param
            segment.isSplat
            ? 0
            : 1
      )

      if (subSegments.length > 1) {
        parts.unshift(subSegments)
      } else if (subSegments.length === 1) {
        parts.unshift(subSegments[0]!)
      }
      node = node.parent
    }

    return parts
  }

  /**
   * Is this tree node matchable? A matchable node has at least one component
   * and a name.
   */
  isMatchable(): this is TreeNode & { name: string } {
    // a node is matchable if it has at least one component
    // and the name is not false
    return this.value.components.size > 0 && this.name !== false
  }

  /**
   * Returns wether this tree node is the root node of the tree.
   *
   * @returns true if the node is the root node
   */
  isRoot(): this is PrefixTree {
    return (
      !this.parent && this.value.fullPath === '/' && !this.value.components.size
    )
  }

  /**
   * Returns wether this tree node has a name. This allows to coerce the type
   * of TreeNode
   */
  isNamed(): this is TreeNodeNamed {
    return !!this.name
  }

  toString(): string {
    return `${this.isRoot() ? '·' : this.value}${
      // either we have multiple names
      this.value.components.size > 1 ||
      // or we have one name and it's not default
      (this.value.components.size === 1 &&
        !this.value.components.get('default'))
        ? ` ⎈(${Array.from(this.value.components.keys()).join(', ')})`
        : ''
    }${this.hasDefinePage ? ' ⚑ definePage()' : ''}`
  }
}

/**
 * Creates a new prefix tree. This is meant to only be the root node. It has access to extra methods that only make
 * sense on the root node.
 */
export class PrefixTree extends TreeNode {
  map = new Map<string, TreeNode>()

  constructor(options: ResolvedOptions) {
    super(options, '')
  }

  override insert(path: string, filePath: string) {
    const node = super.insert(path, filePath)
    this.map.set(filePath, node)

    return node
  }

  /**
   * Returns the tree node of the given file path.
   *
   * @param filePath - file path of the tree node to get
   */
  getChild(filePath: string) {
    return this.map.get(filePath)
  }

  /**
   * Removes the tree node of the given file path.
   *
   * @param filePath - file path of the tree node to remove
   */
  removeChild(filePath: string) {
    if (this.map.has(filePath)) {
      this.map.get(filePath)!.delete()
      this.map.delete(filePath)
    }
  }
}

/**
 * Conflict between `_parent` files and same-name files.
 *
 * @internal
 */
export interface ParentConflict {
  routePath: string
  parentFilePath: string
  filePath: string
}

/**
 * Collects conflicts between `_parent` files and same-name files.
 *
 * @param tree - prefix tree to scan
 *
 * @internal
 */
export function collectParentConflicts(tree: PrefixTree): ParentConflict[] {
  const conflicts: ParentConflict[] = []
  const seen = new Set<string>()

  for (const [filePath, node] of tree.map) {
    if (!isParentFile(filePath)) continue
    const siblingFilePath = getSiblingFilePath(filePath)
    if (!siblingFilePath || !tree.map.has(siblingFilePath)) continue

    const key = `${node.fullPath}::${filePath}::${siblingFilePath}`
    if (seen.has(key)) continue
    seen.add(key)
    conflicts.push({
      routePath: node.fullPath,
      parentFilePath: filePath,
      filePath: siblingFilePath,
    })
  }

  return conflicts
}

/**
 * Splits a path into by finding the first '/' and returns the tail and segment. If it has an extension, it removes it.
 * If it contains a named view, it returns the view name as well (otherwise it's default).
 *
 * @param filePath - filePath to split
 */
function splitFilePath(filePath: string) {
  const slashPos = filePath.indexOf('/')
  let head = slashPos < 0 ? filePath : filePath.slice(0, slashPos)
  const tail = slashPos < 0 ? '' : filePath.slice(slashPos + 1)

  let segment = head
  let viewName = 'default'

  const namedSeparatorPos = segment.indexOf('@')

  if (namedSeparatorPos > 0) {
    viewName = segment.slice(namedSeparatorPos + 1)
    segment = segment.slice(0, namedSeparatorPos)
  }

  return {
    segment,
    tail,
    viewName,
  }
}

function isParentFile(filePath: string) {
  return filePath.includes('/_parent.') || filePath.includes('/_parent@')
}

function getSiblingFilePath(filePath: string) {
  const siblingFilePath = filePath.replace(/\/_parent(?=[@.])/, '')
  return siblingFilePath === filePath ? null : siblingFilePath
}
