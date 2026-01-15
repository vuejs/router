import { allCodeFeatures, type VueLanguagePlugin } from '@vue/language-core'
import { replace, toString } from 'muggle-string'

const plugin: VueLanguagePlugin = () => {
  const routeBlockIdPrefix = 'route_'
  const routeBlockIdRe = new RegExp(`^${routeBlockIdPrefix}(\\d+)$`)

  return {
    version: 2.1,
    getEmbeddedCodes(_fileName, sfc) {
      const embeddedCodes = []

      // we add an embedded code for every route block we find with the same index as the block
      for (let i = 0; i < sfc.customBlocks.length; i++) {
        const block = sfc.customBlocks[i]!

        // TODO:
        // `<route>` blocks without `lang="json"` are still interpreted as text right now.
        // See: https://github.com/vuejs/language-tools/issues/185#issuecomment-1173742726
        // This seems to be because `custom_block_x` is still seen as txt, even though the corresponding `route_x` is json.
        if (block.type === 'route') {
          const lang = block.lang === 'txt' ? 'json' : block.lang
          embeddedCodes.push({ id: `${routeBlockIdPrefix}${i}`, lang })
        }
      }

      return embeddedCodes
    },
    resolveEmbeddedCode(_fileName, sfc, embeddedCode) {
      const match = embeddedCode.id.match(routeBlockIdRe)

      if (match) {
        const i = parseInt(match[1]!)
        const block = sfc.customBlocks[i]

        // this shouldn't happen, but just in case
        if (!block) {
          return
        }

        embeddedCode.content.push([
          block.content,
          block.name,
          0,
          allCodeFeatures,
        ])

        if (embeddedCode.lang === 'json') {
          const contentStr = toString(embeddedCode.content)
          if (
            contentStr.trim().startsWith('{') &&
            !contentStr.includes('$schema')
          ) {
            replace(
              embeddedCode.content,
              '{',
              '{\n  "$schema": "https://router.vuejs.org/schemas/route.schema.json",'
            )
          }
        }
      }
    },
  }
}

export default plugin
