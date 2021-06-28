import { createApp, ComponentPublicInstance, App } from 'vue'
import { Router } from '../src'

const context = require.context('.', true, /^.{2,}\/index\.ts$/)
const DIR_RE = /^\.\/([^/]+)\//

const examples: string[] = []
context.keys().forEach(path => {
  const match = DIR_RE.exec(path)
  if (match) examples.push(match[1])
})
examples.sort()

declare global {
  interface Window {
    app: App<Element>
    // @ts-ignore: wat???
    vm: ComponentPublicInstance
    r: Router
  }
}

const app = createApp({
  data: () => ({ examples }),
})

app.mount('#app')
window.app = app
