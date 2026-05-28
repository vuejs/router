import { defineParamParser } from 'vue-router/experimental'

export const parser = defineParamParser<boolean>({
  get: value => value === 'true' || value === '1',
  set: value => (value ? '1' : '0'),
})
