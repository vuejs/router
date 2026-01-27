import type { Code } from '@vue/language-core'

/**
 * Augments the VLS context (volar) with additianal type information.
 *
 * @param content - content retrieved from the volar pluign
 * @param codes - codes to add to the VLS context
 */
export function augmentVlsCtx(content: Code[], codes: Code[]) {
  let from = -1

  for (let i = 0; i < content.length; i++) {
    const code = content[i]

    if (typeof code !== 'string') {
      continue
    }

    if (from === -1 && code.startsWith(`const __VLS_ctx`)) {
      from = i
    } else if (from !== -1) {
      if (code === `}`) {
        content.splice(i, 0, ...codes.map(code => `...${code},\n`))
        break
      } else if (code === `;\n`) {
        content.splice(
          from + 1,
          i - from,
          `{\n`,
          `...`,
          ...content.slice(from + 1, i),
          `,\n`,
          ...codes.map(code => `...${code},\n`),
          `}`,
          `;\n`
        )
        break
      }
    }
  }
}
