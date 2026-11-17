import type { Code } from '@vue/language-core'
import { createSourceRewrite } from 'muggle-string'

export function toString(codes: Code[]): string {
  return codes.map(code => (typeof code === 'string' ? code : code[0])).join('')
}

export function replaceSourceRange(
  codes: Code[],
  source: string | undefined,
  start: number,
  end: number,
  text: string
): boolean {
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]!
    if (
      typeof code === 'string' ||
      code[1] !== source ||
      start < code[2] ||
      end > code[2] + code[0].length
    ) {
      continue
    }

    const rewrite = createSourceRewrite({ content: code[0] })
    rewrite.replace(start - code[2], end - code[2], text)
    const replacement: Code[] = []
    rewrite.render(0, code[0].length, piece => {
      replacement.push(
        typeof piece === 'string'
          ? piece
          : [
              code[0].slice(piece.start, piece.end),
              code[1],
              code[2] + piece.start,
              code[3],
            ]
      )
    })
    codes.splice(i, 1, ...replacement)
    return true
  }
  return false
}
