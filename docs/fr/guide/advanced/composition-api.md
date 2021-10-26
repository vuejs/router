# Vue Router et la'Composition API

<VueSchoolLink 
  href="https://vueschool.io/lessons/router-and-the-composition-api"
  title="Learn how to use Vue Router with the composition API"
/>

L'introduction de `setup` et de l'[API de composition](https://v3.vuejs.org/guide/composition-api-introduction.html) de Vue, ouvre de nouvelles possibilités mais pour être en mesure d'obtenir le plein potentiel de Vue Router, nous devrons utiliser quelques nouvelles fonctions pour remplacer l'accès à `this` et les gardes de navigation dans le composant.

## Accès au routeur et à la route actuelle dans `setup`.

Parce que nous n'avons pas accès à `this` à l'intérieur de `setup`, nous ne pouvons plus accéder directement à `this.$router` ou `this.$route`. A la place, nous utilisons la fonction `useRouter` :

```js
import { useRouter, useRoute } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()

    function pushWithQuery(query) {
      router.push({
        name: 'search',
        query: {
          ...route.query,
        },
      })
    }
  },
}
```

L'objet `route` est un objet réactif, donc n'importe laquelle de ses propriétés peut être surveillée et vous devriez **éviter de surveiller l'objet `route`** entier. Dans la plupart des cas, vous devriez observer directement le paramètre que vous souhaitez modifier.

```js
import { useRoute } from 'vue-router'
import { ref, watch } from 'vue'

export default {
  setup() {
    const route = useRoute()
    const userData = ref()

    // récupérer les informations de l'utilisateur lorsque les paramètres changent
    watch(
      () => route.params.id,
      async newId => {
        userData.value = await fetchUser(newId)
      }
    )
  },
}
```

Notez que nous avons toujours accès à `$router` et `$route` dans les modèles, il n'y a donc pas besoin de retourner `router` ou `route` à l'intérieur de `setup`.

## Gardes de navigation

Bien que vous puissiez toujours utiliser les gardes de navigation dans le composant avec une fonction `setup`, Vue Router expose les gardes de mise à jour et de sortie comme des fonctions de l'API de composition :

```js
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { ref } from 'vue'

export default {
  setup() {
    // comme l'option beforeRouteLeave sans accès à `this`.
    onBeforeRouteLeave((to, from) => {
      const answer = window.confirm(
        'Do you really want to leave? you have unsaved changes!'
      )
      // annuler la navigation et rester sur la même page
      if (!answer) return false
    })

    const userData = ref()

    // comme l'option beforeRouteUpdate sans accès à `this`.
    onBeforeRouteUpdate(async (to, from) => {
      // ne récupère l'utilisateur que si l'identifiant a changé, car peut-être que seule la requête ou le hachage a changé.
      if (to.params.id !== from.params.id) {
        userData.value = await fetchUser(to.params.id)
      }
    })
  },
}
```

Les gardes de l'API de composition peuvent également être utilisées dans n'importe quel composant rendu par `<router-view>`, elles ne doivent pas être utilisées directement sur le composant de route comme les gardes in-component.

## `useLink`

Vue Router expose le comportement interne de RouterLink comme une fonction de l'API de composition. Elle donne accès aux mêmes propriétés que l'API [`v-slot`](../../api/#router-link-s-v-slot) :

```js
import { RouterLink, useLink } from 'vue-router'
import { computed } from 'vue'

export default {
  name: 'AppLink',

  props: {
    // ajouter @ts-ignore si vous utilisez TypeScript
    ...RouterLink.props,
    inactiveClass: String,
  },

  setup(props) {
    const { route, href, isActive, isExactActive, navigate } = useLink(props)

    const isExternalLink = computed(
      () => typeof props.to === 'string' && props.to.startsWith('http')
    )

    return { isExternalLink, href, navigate, isActive }
  },
}
```
