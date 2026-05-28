import { defineParamParserRaw } from 'vue-router/experimental'

export const parser = defineParamParserRaw<Set<string>>({
  get: value => {
    if (value == null) return new Set()
    return new Set(
      Array.isArray(value) ? value.filter(v => v != null) : [value]
    )
  },
  set: value => {
    if (value.size === 0) return null // drop the param from the URL
    if (value.size === 1) return [...value][0]! // /one  or  ?k=one
    return [...value] // /a/b/c  or  ?k=a&k=b&k=c
  },
})
