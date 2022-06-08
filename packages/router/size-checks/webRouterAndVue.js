import { h, createApp } from '@vue/runtime-dom'
import { createRouter, createWebHistory } from '../dist/vue-router.esm-bundler'

createRouter({
  history: createWebHistory(),
  routes: [],
})

// The bare minimum code required for rendering something to the screen
createApp({
  render: () => h('div', 'hello world!'),
}).mount('#app')
