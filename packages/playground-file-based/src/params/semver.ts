import { defineParamParser, miss } from 'vue-router/experimental'
import { parse, type SemVer } from 'semver'

export const parser = defineParamParser({
  get: (value): SemVer | SemVer[] => {
    if (!value) {
      miss()
    }
    return Array.isArray(value)
      ? value.map(
          v => (v && parse(v, true, true)) || miss(`Invalid semver: "${v}"`)
        )
      : (parse(value, true, true) ?? miss(`Invalid semver: "${value}"`))
  },
  set: (value: SemVer): string => value.format(),
})
