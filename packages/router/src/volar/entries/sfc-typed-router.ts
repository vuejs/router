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

const plugin: VueLanguagePlugin = ({
  compilerOptions,
  modules: { typescript: ts },
}) => {
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
      const relativeFilePath = compilerOptions.rootDir
        ? relative(compilerOptions.rootDir, fileName)
        : fileName

      const useRouteNameType = `import('vue-router/auto-routes')._RouteNamesForFilePath<'${relativeFilePath}'>`
      const useRouteNameTypeParam = `<${useRouteNameType}>`

      if (sfc.scriptSetup) {
        visit(sfc.scriptSetup.ast)
      }

      function visit(node: ts.Node) {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'useRoute' &&
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
            const start = node.getStart(sfc.scriptSetup!.ast)
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
              node.end,
              node.end,
              ` as ReturnType<typeof useRoute${useRouteNameTypeParam}>)`
            )
          }
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
}

export default plugin
