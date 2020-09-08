# Variable

## RouterLink

## RouterView

## START_LOCATION

Initial route location where the router is. Can be used in navigation guards to differentiate the initial navigation.

**Signature:**
```typescript
START_LOCATION_NORMALIZED: RouteLocationNormalizedLoaded
```

### Examples


```js
import { START_LOCATION } from 'vue-router'

router.beforeEach((to, from) => {
  if (from === START_LOCATION) {
    // initial navigation
  }
})
```


