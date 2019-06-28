// Own simplified consola version

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
}
