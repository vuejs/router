import { defineParamParser, miss } from 'vue-router/experimental'

export const parser = defineParamParser({
  get: value => {
    if (!value) {
      return null
    }
    return Array.isArray(value)
      ? value.map(v =>
          v?.[0] === '@' ? v.slice(1) : miss(`"${value}" must start with "@"`)
        )
      : value[0] === '@'
        ? value.slice(1)
        : miss(`"${value}" must start with "@"`)
  },
  set: value =>
    value == null
      ? null
      : Array.isArray(value)
        ? value.map(v => `@${v}`)
        : `@${value}`,
})
