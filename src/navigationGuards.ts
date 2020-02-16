import { NavigationGuard } from './types'
import { inject, getCurrentInstance, warn } from 'vue'
import { matchedRouteKey } from './components/View'

export function onBeforeRouteLeave(leaveGuard: NavigationGuard) {
  const instance = getCurrentInstance()
  if (!instance) {
    __DEV__ &&
      warn('onRouteLeave must be called at the top of a setup function')
    return
  }

  // TODO: fix wrong type
  const matched = inject(matchedRouteKey, {} as any).value

  if (!matched) {
    __DEV__ &&
      warn('onRouteLeave must be called at the top of a setup function')
    return
  }

  // @ts-ignore
  matched.leaveGuards.push(leaveGuard.bind(instance.proxy))
}
