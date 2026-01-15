/**
 * This file only contain types and is used for the generated d.ts to avoid polluting the global namespace.
 * https://github.com/posva/unplugin-vue-router/issues/136
 */

export type { Options } from './options'
export type { TreeNode } from './core/tree'
export type {
  TreeNodeValue,
  TreeNodeValueStatic,
  TreeNodeValueParam,
  TreeNodeValueGroup,
} from './core/treeNodeValue'
export type { EditableTreeNode } from './core/extendRoutes'
