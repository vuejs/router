import { defineParamParser, miss } from 'vue-router/experimental'

export const parser = defineParamParser<string>({
  get: value => {
    if (value[0] !== '@') {
      miss(`"${value}" must start with "@"`)
    }
    return value.slice(1)
  },
  set: value => `@${value}`,
})
