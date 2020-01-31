import { NavigationGuard } from './types'
import { inject, getCurrentInstance, warn } from 'vue'
import { matchedRouteKey } from './components/View'

// TODO: why is this necessary if it's in global.d.ts, included in tsconfig.json
declare var __DEV__: boolean

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

  matched.leaveGuards.push(leaveGuard.bind(instance!.proxy))
}
