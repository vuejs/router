import Vue from 'vue'

const context = require.context('.', true, /^.{2,}\/index\.ts$/)
const DIR_RE = /^\.\/([^/]+)\//

const examples: string[] = []
context.keys().forEach(path => {
  const match = DIR_RE.exec(path)
  if (match) examples.push(match[1])
  return name
})
examples.sort()

new Vue({
  el: '#app',
  data: { examples },
})
