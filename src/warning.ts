import { warn as vueWarn } from 'vue'

const originalWarn = console.warn
function customWarn(msg: string, ...args: any[]) {
  originalWarn(msg.replace('Vue warn', 'Vue Router warn'), ...args)
}

export function warn(msg: string, ...args: any[]) {
  console.warn = customWarn
  vueWarn(msg, ...args)
  console.warn = originalWarn
}
