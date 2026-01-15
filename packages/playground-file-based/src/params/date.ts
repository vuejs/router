import { defineParamParser, miss } from 'vue-router/experimental'

function toDate(value: string): Date {
  const asDate = new Date(value)
  if (Number.isNaN(asDate.getTime())) {
    throw miss(`Invalid date: "${value}"`)
  }

  return asDate
}

function toString(value: Date): string {
  return (
    value
      .toISOString()
      // allows keeping simple dates like 2023-10-01 without time
      // while still being able to parse full dates like 2023-10-01T12:00:00.000Z
      .replace('T00:00:00.000Z', '')
  )
}

export const parser = defineParamParser({
  get: (value: string | string[] | null) => {
    if (!value) {
      throw miss()
    }
    return Array.isArray(value) ? value.map(toDate) : toDate(value)
  },
  set: (value: Date | Date[]) =>
    Array.isArray(value) ? value.map(toString) : toString(value),
})
