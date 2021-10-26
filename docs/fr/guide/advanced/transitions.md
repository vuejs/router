# Transitions

<VueSchoolLink 
  href="https://vueschool.io/lessons/route-transitions"
  title="Learn about route transitions"
/>

Pour utiliser des transitions sur vos composants de route et animer les navigations, vous devez utiliser l'API [v-slot](../../api/#router-view-s-v-slot) :

```html
<router-view v-slot="{ Component }">
  <transition name="fade">
    <component :is="Component" />
  </transition>
</router-view>
```

[Toutes les API de transition](https://v3.vuejs.org/guide/transitions-enterleave.html) fonctionnent de la même manière ici.

## Transition par route

L'utilisation ci-dessus appliquera la même transition pour toutes les routes. Si vous voulez que les composants de chaque route aient des transitions différentes, vous pouvez combiner [meta fields](./meta.md) et un `name` dynamique sur `<transition>` :

```js
const routes = [
  {
    path: '/custom-transition',
    component: PanelLeft,
    meta: { transition: 'slide-left' },
  },
  {
    path: '/other-transition',
    component: PanelRight,
    meta: { transition: 'slide-right' },
  },
]
```

```html
<router-view v-slot="{ Component, route }">
  <!-- Utilisez n'importe quelle transition personnalisée et revenez à `fade` -->
  <transition :name="route.meta.transition || 'fade'">
    <component :is="Component" />
  </transition>
</router-view>
```

## Transition dynamique basée sur l'itinéraire

Il est également possible de déterminer la transition à utiliser de manière dynamique en fonction de la relation entre l'itinéraire cible et l'itinéraire actuel. En utilisant un snippet très similaire à celui juste avant :

```html
<!-- utiliser un nom de transition dynamique -->
<router-view v-slot="{ Component, route }">
  <transition :name="route.meta.transitionName">
    <component :is="Component" />
  </transition>
</router-view>
```

Nous pouvons ajouter un [crochet d'après-navigation] (./navigation-guards.md#global-after-hooks) pour ajouter dynamiquement des informations au champ `meta` en fonction de la profondeur de l'itinéraire.

```js
router.afterEach((to, from) => {
  const toDepth = to.path.split('/').length
  const fromDepth = from.path.split('/').length
  to.meta.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left'
})
```

## Forcer une transition entre les vues réutilisées

Vue peut réutiliser automatiquement des composants qui se ressemblent, évitant ainsi toute transition. Heureusement, il est possible [d'ajouter un attribut `key`](https://v3.vuejs.org/api/special-attributes.html#key) pour forcer les transitions. Cela vous permet également de déclencher des transitions tout en restant sur la même route avec des paramètres différents :

```vue
<router-view v-slot="{ Component, route }">
  <transition name="fade">
    <component :is="Component" :key="route.path" />
  </transition>
</router-view>
```

<!-- TODO : exemple interactif -->
<!-- Voir l'exemple complet [ici](https://github.com/vuejs/vue-router/blob/dev/examples/transitions/app.js). -->
