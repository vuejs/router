import { defineParamParser, miss } from 'vue-router/experimental'

export type Color = 'red' | 'green' | 'blue'
const COLORS: readonly string[] = ['red', 'green', 'blue']

export const parser = defineParamParser<Color>({
  get: value =>
    typeof value === 'string' && COLORS.includes(value)
      ? (value as Color)
      : miss(`unknown color "${String(value)}"`),
  set: value => value,
})
