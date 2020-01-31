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

  const matched = inject(matchedRouteKey, {}).value

  if (!matched) {
    __DEV__ &&
      warn('onRouteLeave must be called at the top of a setup function')
    return
  }

  matched.leaveGuards.push(leaveGuard.bind(instance.proxy))
}
