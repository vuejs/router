import { defineParamParser, miss } from 'vue-router/experimental'
import { parse, type SemVer, Range, validRange } from 'semver'

export const parser = defineParamParser({
  get: (value: string): SemVer | Range => {
    return (
      parse(value, false, false) ||
      (validRange(value) && new Range(value)) ||
      miss(`Invalid version "${value}"`)
    )
  },
  set: (value: SemVer | Range): string => value.format(),
})
