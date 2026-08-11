import { relative } from 'pathe'
import type { VueLanguagePlugin } from '@vue/language-core'
import { replaceSourceRange, toString } from 'muggle-string'
import { augmentVlsCtx } from '../utils/augment-vls-ctx'
import type ts from 'typescript'

/*
  Future ideas:
  - Enhance typing of `onBeforeRouteUpdate() to and from parameters
  - Enhance typing of `onBeforeRouteLeave() from parameter
  - Enhance typing of `<RouterView>`
    - Typed `name` attribute for named views
    - Typed `route` slot prop when using `<RouterView v-slot="{route}">`
  - (low priority) Enhance typing of `to` route in `beforeEnter` route guards defined in `definePage`
*/

const plugin: VueLanguagePlugin<{ options?: { rootDir?: string } }> = ({
  compilerOptions,
  modules: { typescript: ts },
  config: { options },
}) => {
  // Prioritize plugin options over tsconfig
  const rootDir = options?.rootDir ?? compilerOptions.rootDir

  // Warn if no rootDir specified
  if (!rootDir) {
    console.warn(
      '[vue-router] No rootDir specified. Set it in the Volar plugin options or tsconfig compilerOptions.rootDir for proper typed routes.'
    )
  }

  const RE = {
    DOLLAR_ROUTE: {
      /**
       * When using `$route` in a template, it is referred
       * to as `__VLS_ctx.$route` in the virtual file.
       */
      VLS_CTX: /\b__VLS_ctx.\$route\b/g,
    },
  }

  return {
    version: 2.1,
    resolveEmbeddedCode(fileName, sfc, embeddedCode) {
      if (!embeddedCode.id.startsWith('script_')) {
        return
      }

      // TODO: Do we want to apply this to EVERY .vue file or only to components that the user wrote themselves?

      // NOTE: this might not work if different from the root passed to VueRouter unplugin
      const relativeFilePath = rootDir ? relative(rootDir, fileName) : fileName

      // Escape backslashes/apostrophes so we can safely embed the file path
      // inside a single-quoted TS string literal type argument.
      const escapedFilePath = relativeFilePath
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")

      const useRouteNameType = `import('vue-router/auto-routes')._RouteNamesForFilePath<'${escapedFilePath}'>`
      const useRouteNameTypeParam = `<${useRouteNameType}>`

      const definePageFilePathTypeParam = `<'${escapedFilePath}'>`

      if (sfc.scriptSetup) {
        visit(sfc.scriptSetup.ast)
      }

      function visit(node: ts.Node) {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          ts.idText(node.expression) === 'useRoute' &&
          !node.typeArguments &&
          !node.arguments.length
        ) {
          if (!sfc.scriptSetup!.lang.startsWith('js')) {
            replaceSourceRange(
              embeddedCode.content,
              sfc.scriptSetup!.name,
              node.expression.end,
              node.expression.end,
              useRouteNameTypeParam
            )
          } else {
            const { start, end } = getStartEnd(node, sfc.scriptSetup!.ast)
            replaceSourceRange(
              embeddedCode.content,
              sfc.scriptSetup!.name,
              start,
              start,
              `(`
            )
            replaceSourceRange(
              embeddedCode.content,
              sfc.scriptSetup!.name,
              end,
              end,
              ` as ReturnType<typeof useRoute${useRouteNameTypeParam}>)`
            )
          }
        } else if (
          ts.isTypeQueryNode(node) &&
          ts.isIdentifier(node.exprName) &&
          ts.idText(node.exprName) === 'useRoute' &&
          !node.typeArguments &&
          !sfc.scriptSetup!.lang.startsWith('js')
        ) {
          // Without type arguments, `typeof useRoute` falls back to the generic
          // default (every route), so `ReturnType<typeof useRoute>` is wider
          // than what `useRoute()` actually returns in this file. Instantiate
          // it with this file's routes so both agree.
          replaceSourceRange(
            embeddedCode.content,
            sfc.scriptSetup!.name,
            node.exprName.end,
            node.exprName.end,
            useRouteNameTypeParam
          )
        } else if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          ts.idText(node.expression) === 'definePage' &&
          !node.typeArguments &&
          node.arguments.length === 1 &&
          !sfc.scriptSetup!.lang.startsWith('js')
        ) {
          // Inject the file path so `definePage`'s `params.path` keys can be
          // narrowed to this file's actual path params.
          replaceSourceRange(
            embeddedCode.content,
            sfc.scriptSetup!.name,
            node.expression.end,
            node.expression.end,
            definePageFilePathTypeParam
          )
        } else {
          ts.forEachChild(node, visit)
        }
      }

      const contentStr = toString(embeddedCode.content)

      const vlsCtxAugmentations: string[] = []

      // Augment `__VLS_ctx.$route` to override the typings of `$route` in template blocks
      if (contentStr.match(RE.DOLLAR_ROUTE.VLS_CTX)) {
        vlsCtxAugmentations.push(
          `{} as { $route: ReturnType<typeof import('vue-router').useRoute${useRouteNameTypeParam}> }`
        )
      }

      // We can try augmenting the types for `RouterView` below.
      // if (contentStr.includes(`__VLS_WithComponent<'RouterView', __VLS_LocalComponents`)) {
      //   vlsCtxAugmentations.push(`RouterView: 'test';`)
      // }

      if (vlsCtxAugmentations.length) {
        augmentVlsCtx(embeddedCode.content, vlsCtxAugmentations)
      }
    },
  }

  function getStartEnd(node: ts.Node, ast: ts.SourceFile) {
    return {
      // NOTE: internal API, used by volar
      start: (ts as any).getTokenPosOfNode(node, ast) as number,
      end: node.end,
    }
  }
}

export default plugin
