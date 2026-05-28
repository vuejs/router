import { defineParamParserRaw } from 'vue-router/experimental'

export const parser = defineParamParserRaw<string[]>({
  get: value => {
    console.log('csv', value)
    if (value == null) return []
    return (
      (Array.isArray(value) ? value : [value])
        .flatMap(val => val?.split(','))
        // cleanup empty stings and undefined
        .filter((v): v is string => !!v)
    )
  },
  set: value => (value.length ? value.join(',') : null),
})
