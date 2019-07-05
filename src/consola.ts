// Own simplified consola version
// Consola doesn't work on IE9

type LogCommand = 'info' | 'log' | 'error' | 'warn'
const logs: LogCommand[] = ['info', 'log', 'error', 'warn']

export default {
  tag: '',
  withTag(tag: string) {
    const cs = Object.create(this)
    cs.tag = tag
    return cs
  },

  info(...args: any[]) {
    if (this.tag) console.info(`[${this.tag}]`, ...args)
    else console.info(...args)
  },

  mockTypes(spyCreator: () => any): void {
    for (const log of logs) {
      // @ts-ignore
      this[log] = spyCreator()
    }
  },
}
