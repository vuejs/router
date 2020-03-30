import { NavigationGuard } from './types'
import { inject, getCurrentInstance, warn } from 'vue'
import { matchedRouteKey } from './utils/injectionSymbols'

export function onBeforeRouteLeave(leaveGuard: NavigationGuard) {
  const instance = getCurrentInstance()
  if (!instance) {
    __DEV__ &&
      warn('onRouteLeave must be called at the top of a setup function')
    return
  }

  const activeRecord = inject(matchedRouteKey, {} as any).value

  if (!activeRecord) {
    __DEV__ &&
      warn('onRouteLeave must be called at the top of a setup function')
    return
  }

  activeRecord.leaveGuards.push(
    // @ts-ignore do we even want to allow that? Passing the context in a composition api hook doesn't make sense
    leaveGuard.bind(instance.proxy)
  )
}
