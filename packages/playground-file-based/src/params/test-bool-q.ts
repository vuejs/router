import { defineQueryParamParser } from 'vue-router/experimental'

export const parser = defineQueryParamParser<boolean>({
  get: value => value === 'true' || value === '1',
  set: value => (value ? '1' : '0'),
})
