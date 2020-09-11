import { RouteRecordRaw } from './index'
import { defineComponent } from 'vue'

const component = defineComponent({})
const components = { default: component }

const routes: RouteRecordRaw[] = []

routes.push({ path: '/', redirect: '/foo' })

// @ts-expect-error cannot have components and component at the same time
routes.push({ path: '/', components, component })

routes.push({
  path: '/',
  redirect: '/foo',
  children: [],
})

routes.push({ path: '/', component, props: true })
routes.push({ path: '/', component, props: to => to.params.id })
// @ts-expect-error: props should be an object
routes.push({ path: '/', components, props: to => to.params.id })
routes.push({ path: '/', components, props: { default: to => to.params.id } })
routes.push({ path: '/', components, props: true })

// let r: RouteRecordRaw = {
//   path: '/',
//   component,
//   components,
// }
