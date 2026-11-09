import { defineParamParser, miss } from 'vue-router/experimental'
import { normalizeFull, tryParse, type SemVer } from 'verkit'

export const parser = defineParamParser<SemVer>({
  get: value => {
    return (
      tryParse(value, { loose: true }) ?? miss(`Invalid semver: "${value}"`)
    )
  },
  set: value => normalizeFull(value)!,
})
