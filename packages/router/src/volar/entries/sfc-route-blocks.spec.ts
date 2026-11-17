import type { Code } from '@vue/language-core'
import { describe, expect, it } from 'vitest'
import plugin from './sfc-route-blocks'

function transform(code: string, lang = 'json') {
  const result = plugin({} as any)
  const instance = Array.isArray(result) ? result[0]! : result
  const content: Code[] = []

  instance.resolveEmbeddedCode!(
    '/app/page.vue',
    {
      customBlocks: [{ type: 'route', name: 'custom_block_0', content: code }],
    } as any,
    { id: 'route_0', lang, content } as any
  )

  return {
    content,
    text: content
      .map(code => (typeof code === 'string' ? code : code[0]))
      .join(''),
  }
}

describe('sfc-route-blocks volar plugin', () => {
  it('inserts the route schema in JSON blocks', () => {
    const { text } = transform('{ "name": "home" }')

    expect(text).toBe(
      '{\n  "$schema": "https://router.vuejs.org/schemas/route.schema.json", "name": "home" }'
    )
    expect(JSON.parse(text)).toEqual({
      $schema: 'https://router.vuejs.org/schemas/route.schema.json',
      name: 'home',
    })
  })

  it('keeps an existing schema', () => {
    const code =
      '{ "$schema": "https://example.com/schema.json", "name": "home" }'
    expect(transform(code).text).toBe(code)
  })

  it('keeps non-JSON blocks', () => {
    const code = '{ name: "home" }'
    expect(transform(code, 'json5').text).toBe(code)
  })

  it('preserves source offsets and code features after the inserted schema', () => {
    const code = '  { "name": "home" }'
    const { content } = transform(code)
    const mapped = content.filter((piece): piece is Exclude<Code, string> =>
      Array.isArray(piece)
    )

    expect(mapped.map(piece => piece[0]).join('')).toContain(
      ' "name": "home" }'
    )
    for (const [text, source, offset, features] of mapped) {
      expect(source).toBe('custom_block_0')
      expect(code.slice(offset, offset + text.length)).toBe(text)
      expect(features).toEqual({
        verification: true,
        completion: true,
        semantic: true,
        navigation: true,
        structure: true,
        format: true,
      })
    }
  })
})
