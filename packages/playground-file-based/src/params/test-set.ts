import { defineParamParserRaw } from 'vue-router/experimental'

export const parser = defineParamParserRaw({
  get(value) {
    console.log('parsing test-set value', value)
    const asArray = (Array.isArray(value) ? value : [value]).filter(
      v => v != null
    )

    return new Set<string>(asArray)
  },
  set(value) {
    console.log('stringifying test-set value', value)
    return [...value]
  },
})
