import { defineParamParser } from 'vue-router/experimental'

interface MyType {
  value: string | null
}

export const parser = defineParamParser({
  get: (value): MyType | MyType[] | null => {
    if (!value || value === 'null') return null
    return Array.isArray(value)
      ? value
          .filter(v => v != null)
          .map(v => ({ value: v === 'null' ? null : v }))
      : { value }
  },
  set: (value: MyType | null): string | null => (value ? value.value : null),
})
