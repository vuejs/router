import './global.css'
import type { ComponentPublicInstance, App } from 'vue';
import { createApp } from 'vue'
import type { Router } from '../src'

const tsmap = import.meta.glob('./**/index.ts')

const DIR_RE = /^\.\/([^/]+)\//

const examples: string[] = Object.keys(tsmap)
  .map(path => DIR_RE.exec(path))
  .filter(match => !!match)
  .map(match => match![1] + '/')
  .sort()

declare global {
  interface Window {
    app: App
    vm: ComponentPublicInstance
    r: Router
  }
}

const app = createApp({
  data: () => ({ examples }),
})

app.mount('#app')
window.app = app
