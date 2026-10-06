import { expectTypeOf } from 'vitest'
import { definePage } from '../../runtime'
import type { DefinePageQueryParamOptions } from '../../runtime'

expectTypeOf<DefinePageQueryParamOptions<'int'>['default']>().toEqualTypeOf<
  number | (() => number) | undefined
>()

definePage({ params: { query: { page: 'int' } } })
definePage({ params: { query: { page: { parser: 'int', default: 1 } } } })
definePage({
  params: { query: { page: { parser: 'int', default: () => 1 } } },
})
definePage({
  params: { query: { page: { parser: 'int', required: true } } },
})
definePage({
  params: {
    query: { page: { parser: 'int', required: false, default: 1 } },
  },
})

definePage({
  params: {
    query: {
      // @ts-expect-error: an int parser requires a numeric default
      page: { parser: 'int', default: 'one' },
    },
  },
})
definePage({
  params: {
    query: {
      // @ts-expect-error: query defaults cannot be null
      page: { parser: 'int', default: null },
    },
  },
})
definePage({
  params: {
    query: {
      // @ts-expect-error: required params cannot have a default value
      page: { parser: 'int', required: true, default: 1 },
    },
  },
})
definePage({
  params: {
    query: {
      // @ts-expect-error: required params cannot have a default factory
      page: { parser: 'int', required: true, default: () => 1 },
    },
  },
})
