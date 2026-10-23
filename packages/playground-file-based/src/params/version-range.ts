import { defineParamParser, miss } from 'vue-router/experimental'
import {
  normalizeFull,
  normalizeRange,
  tryParse,
  tryParseRange,
  type SemVer,
  type SemVerRange,
} from 'verkit'

export const parser = defineParamParser({
  get: (value: string): SemVer | SemVerRange => {
    return (
      tryParse(value) ||
      tryParseRange(value) ||
      miss(`Invalid version "${value}"`)
    )
  },
  set: (value: SemVer | SemVerRange): string =>
    'sets' in value ? normalizeRange(value)! : normalizeFull(value)!,
})
