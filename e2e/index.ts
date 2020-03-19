import { createApp, ComponentPublicInstance } from 'vue'

const context = require.context('.', true, /^.{2,}\/index\.ts$/)
const DIR_RE = /^\.\/([^/]+)\//

const examples: string[] = []
context.keys().forEach(path => {
  const match = DIR_RE.exec(path)
  if (match) examples.push(match[1])
  return name
})
examples.sort()

declare global {
  interface Window {
    app: typeof app
    vm: ComponentPublicInstance
  }
}

const app = createApp({
  data: () => ({ examples }),
})

app.mount('#app')
window.app = app
