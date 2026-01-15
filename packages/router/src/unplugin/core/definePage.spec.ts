import { TransformResult } from 'vite'
import { expect, describe, it } from 'vitest'
import { definePageTransform, extractDefinePageInfo } from './definePage'
import { ts } from '../utils'
import { mockWarn } from '../../tests/vitest-mock-warn'

const vue = String.raw

const sampleCode = vue`
<script setup>
const a = 1
definePage({
  name: 'custom',
  path: '/custom',
})
const b = 1
</script>

<template>
  <div>hello</div>
</template>
      `

describe('definePage', () => {
  mockWarn()
  it('removes definePage', async () => {
    const result = (await definePageTransform({
      code: sampleCode,
      id: 'src/pages/basic.vue',
    })) as Exclude<TransformResult, string>

    expect(result).toHaveProperty('code')
    expect(result?.code).toMatchSnapshot()
  })

  describe('imports', () => {
    it('keeps used named imports', async () => {
      const result = (await definePageTransform({
        code: vue`
<script setup>
import { my_var, not_used, my_func, my_num } from './lib'
definePage({
  meta: {
    [my_var]: 'hello',
    other: my_func,
    custom() {
      return my_num
    }
  }
})
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(result).toHaveProperty('code')
      expect(result?.code).toMatchSnapshot()
    })

    it('keeps used default imports', async () => {
      const result = (await definePageTransform({
        code: vue`
<script setup>
import my_var from './lib'
definePage({
  meta: {
    [my_var]: 'hello',
  }
  })
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(result).toHaveProperty('code')
      expect(result?.code).toMatchSnapshot()
    })

    it('removes default unused imports', async () => {
      const resultDefault = (await definePageTransform({
        code: vue`
<script setup>
import my_var from './lib'
definePage({name: 'ok'})
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(resultDefault).toHaveProperty('code')
      expect(resultDefault?.code).toMatchSnapshot()
    })

    it('removes unused star imports', async () => {
      const resultStar = (await definePageTransform({
        code: vue`
<script setup>
import * as lib from './my-lib'
definePage({name: 'ok'})
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(resultStar).toHaveProperty('code')
      expect(resultStar?.code).toMatchSnapshot()
    })

    it('works with star imports', async () => {
      const result = (await definePageTransform({
        code: vue`
<script setup>
import * as lib from './my-lib'
definePage({
  meta: {
    [lib.my_var]: 'hello',
  }
  })
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(result).toHaveProperty('code')
      expect(result?.code).toMatchSnapshot()
    })

    it('works when combining named and default imports', async () => {
      const result = (await definePageTransform({
        code: vue`
<script setup>
import my_var, { not_used, my_func, not_used_either } from './lib'
definePage({
  meta: {
    [my_var]: 'hello',
    other: my_func,
  }
})
</script>
`,
        id: 'src/pages/with-imports.vue&definePage&vue&lang.ts',
      })) as Exclude<TransformResult, string>
      expect(result).toHaveProperty('code')
      expect(result?.code).toMatchSnapshot()
    })
  })

  it('works with jsx', async () => {
    const code = ts`
    const a = 1
    definePage({
      name: 'custom',
      path: '/custom',
    })
    const b = 1
    `,
      result = (await definePageTransform({
        code,
        id: 'src/pages/basic.jsx?definePage&lang.jsx',
      })) as Exclude<TransformResult, string>
    expect(result).toBeDefined()
    expect(result).toHaveProperty('code')
    expect(result?.code).toMatchSnapshot()
  })

  it('handles definePage using a variable from setup gracefully', async () => {
    const code = `
<script setup>
const a = 1
definePage({
  name: a,
})
</script>
`
    const result = await definePageTransform({
      code,
      id: 'src/pages/basic.vue&definePage&vue',
    })

    // Should return empty object instead of throwing
    expect(result).toBe('export default {}')
    expect(
      '`definePage()` in <script setup> cannot reference locally declared variables'
    ).toHaveBeenWarned()
  })

  it('extracts name and path', () => {
    expect(extractDefinePageInfo(sampleCode, 'src/pages/basic.vue')).toEqual({
      name: 'custom',
      path: '/custom',
    })
  })

  it('extracts all types of params', () => {
    const codeWithAllParams = vue`
<script setup>
definePage({
  params: {
    path: {
      userId: 'int',
      isActive: 'bool'
    },
    query: {
      page: {
        parser: 'int',
        default: 1,
        format: 'value',
      },
      enabled: 'bool',
      count: {
        parser: 'int',
        default: 42
      },
      active: {
        default: 'none',
      },
    }
  }
})
</script>
`
    expect(
      extractDefinePageInfo(codeWithAllParams, 'src/pages/test.vue')
    ).toEqual({
      params: {
        path: {
          userId: 'int',
          isActive: 'bool',
        },
        query: {
          page: {
            parser: 'int',
            default: '1',
            format: 'value',
          },
          enabled: {
            parser: 'bool',
          },
          count: {
            parser: 'int',
            default: '42',
          },
          active: {
            default: "'none'",
          },
        },
      },
    })
  })

  it('extract name skipped when non existent', async () => {
    expect(
      extractDefinePageInfo(
        vue`
<script setup>
const a = 1
const b = 1
</script>

<template>
  <div>hello</div>
</template>
      `,
        'src/pages/basic.vue'
      )
    ).toBeFalsy()
  })

  it('works with comments', async () => {
    const code = vue`
<script setup>
// definePage
</script>

<template>
  <div>hello</div>
</template>
      `
    // no need to transform
    let result = (await definePageTransform({
      code,
      id: 'src/pages/basic.vue',
    })) as Exclude<TransformResult, string>
    expect(result).toBeFalsy()

    // should give an empty object
    result = (await definePageTransform({
      code,
      id: 'src/pages/basic.vue?definePage&vue',
    })) as Exclude<TransformResult, string>

    expect(result).toBe('export default {}')
  })

  it('works if file is named definePage', async () => {
    const result = (await definePageTransform({
      code: sampleCode,
      id: 'src/pages/definePage.vue',
    })) as Exclude<TransformResult, string>

    expect(result).toHaveProperty('code')
    // should be the sfc without the definePage call
    expect(result?.code).toMatchSnapshot()

    expect(
      await definePageTransform({
        code: sampleCode,
        id: 'src/pages/definePage.vue?definePage&vue',
      })
    ).toMatchObject({
      code: ts`
export default {
  name: 'custom',
  path: '/custom',
}`.trim(),
    })

    expect(
      extractDefinePageInfo(sampleCode, 'src/pages/definePage.vue')
    ).toEqual({
      name: 'custom',
      path: '/custom',
    })
  })

  describe('error handling', () => {
    const codeWithSyntaxError = `
<script setup>
definePage({
  name: 'test',,  // syntax error: extra comma
  path: '/test'
})
</script>

<template>
  <div>hello</div>
</template>
      `

    it('handles syntax errors gracefully when extracting definePage', async () => {
      const result = await definePageTransform({
        code: codeWithSyntaxError,
        id: 'src/pages/broken.vue?definePage&vue',
      })

      // Should return empty object instead of crashing
      expect(result).toBe('export default {}')
      expect('Failed to process definePage:').toHaveBeenWarned()
    })

    it('handles syntax errors gracefully when removing definePage from source', async () => {
      const result = await definePageTransform({
        code: codeWithSyntaxError,
        id: 'src/pages/broken.vue',
      })

      // Should return undefined (no transform) instead of crashing
      expect(result).toBeUndefined()
      expect('Failed to process definePage:').toHaveBeenWarned()
    })

    it('handles extractDefinePageNameAndPath with syntax errors gracefully', async () => {
      const result = extractDefinePageInfo(
        codeWithSyntaxError,
        'src/pages/broken.vue'
      )

      // Should return null/undefined instead of crashing
      expect(result).toBeUndefined()
      expect('Failed to extract definePage info:').toHaveBeenWarned()
    })
  })
})
