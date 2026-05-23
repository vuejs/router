import { defineParamParserRaw } from 'vue-router/experimental'

export const parser = defineParamParserRaw({
  get(value) {
    console.log('parsing set value', value)
    const asArray = (Array.isArray(value) ? value : [value]).filter(
      v => v != null
    )

    // this means we can't have a null value
    return new Set<string>(asArray)
  },
  set(value) {
    console.log('stringifying set value', value)
    return [...value]
  },
})
