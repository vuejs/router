export function comparePathParserScore(a: number[], b: number[]): number {
  let i = 0
  while (i < a.length && i < b.length) {
    if (a[i] < b[i]) return 1
    if (a[i] > b[i]) return -1

    i++
  }

  return a.length < b.length ? 1 : a.length > b.length ? -1 : 0
}
