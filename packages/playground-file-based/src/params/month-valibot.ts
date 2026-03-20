import * as v from 'valibot'

const MonthSchema = v.pipe(
  v.string(),
  v.transform(Number),
  v.integer(),
  v.minValue(1),
  v.maxValue(12)
)

export const parser = MonthSchema

// export const parser = defineParamParser({
//   get: value => {
//     const result = v.safeParse(MonthSchema, value)
//     if (!result.success) {
//       miss()
//     }
//     return result.output
//   },
//   set: value => String(value),
// })
