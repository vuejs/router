# Extension de RouterLink

<VueSchoolLink 
  href="https://vueschool.io/lessons/extending-router-link-for-external-urls"
  title="Learn how to extend router-link"
/>

Le composant RouterLink expose suffisamment de `props` pour suffire à la plupart des applications de base mais il n'essaie pas de couvrir tous les cas d'utilisation possibles et vous vous retrouverez probablement à utiliser `v-slot` pour certains cas avancés. Dans la plupart des applications de taille moyenne à grande, il vaut la peine de créer un, voire plusieurs composants RouterLink personnalisés pour les réutiliser dans toute votre application. Quelques exemples sont les liens dans un menu de navigation, la gestion des liens externes, l'ajout d'une `inactive-class`, etc.

Étendons RouterLink pour gérer également les liens externes et ajouter une `inactive-class` personnalisée dans un fichier `AppLink.vue` :

```vue
<template>
  <a v-if="isExternalLink" v-bind="$attrs" :href="to" target="_blank">
    <slot />
  </a>
  <router-link
    v-else
    v-bind="$props"
    custom
    v-slot="{ isActive, href, navigate }"
  >
    <a
      v-bind="$attrs"
      :href="href"
      @click="navigate"
      :class="isActive ? activeClass : inactiveClass"
    >
      <slot />
    </a>
  </router-link>
</template>

<script>
import { RouterLink } from 'vue-router'

export default {
  name: 'AppLink',
  inheritAttrs: false,

  props: {
    // ajouter @ts-ignore si vous utilisez TypeScript
    ...RouterLink.props,
    inactiveClass: String,
  },

  computed: {
    isExternalLink() {
      return typeof this.to === 'string' && this.to.startsWith('http')
    },
  },
}
</script>
```

Si vous préférez utiliser une fonction de rendu ou créer des propriétés `computed`, vous pouvez utiliser le `useLink` de l'[API de composition](./composition-api.md) :

```js
import { RouterLink, useLink } from 'vue-router'

export default {
  name: 'AppLink',

  props: {
    // ajouter @ts-ignore si vous utilisez TypeScript
    ...RouterLink.props,
    inactiveClass: String,
  },

  setup(props) {
    // `props` contient `to` et tout autre prop qui peut être passé à <router-link>.
    const { navigate, href, route, isActive, isExactActive } = useLink(props)

    // profit!

    return { isExternalLink }
  },
}
```

En pratique, vous voudrez peut-être utiliser votre composant `AppLink` pour différentes parties de votre application. Par exemple, en utilisant [Tailwind CSS](https://tailwindcss.com), vous pourriez créer un composant `NavLink.vue` avec toutes les classes :

```vue
<template>
  <AppLink
    v-bind="$attrs"
    class="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-500 focus:outline-none transition duration-150 ease-in-out hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:text-gray-700 focus:border-gray-300 transition duration-150 ease-in-out"
    active-class="border-indigo-500 text-gray-900 focus:border-indigo-700"
    inactive-class="text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:text-gray-700 focus:border-gray-300"
  >
    <slot />
  </AppLink>
</template>
```
