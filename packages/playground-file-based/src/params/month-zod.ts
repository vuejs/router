import { defineParamParser } from 'vue-router/experimental'
import { z } from 'zod'

const MonthSchema = z.coerce.number().int().min(1).max(12)
export const parser = MonthSchema

// export const parser = defineParamParser({
//   get: (value): number => {
//     return MonthSchema.parse(value)
//   },
//   set: (value: number): string => String(value),
// })
