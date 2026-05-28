import { defineParamParser, miss } from 'vue-router/experimental'

export const parser = defineParamParser<number>({
  get: value => {
    const n = Number(value)
    if (!value || Number.isNaN(n)) miss(`"${value}" is not a number`)
    return n
  },
  set: value => String(value),
})
