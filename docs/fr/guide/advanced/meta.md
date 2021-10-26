# Champs méta de la route

<VueSchoolLink 
  href="https://vueschool.io/lessons/route-meta-fields"
  title="Learn how to use route meta fields"
/>

Parfois, vous pouvez vouloir attacher des informations arbitraires aux routes comme les noms de transition, qui peut accéder à la route, etc. Ceci peut être réalisé grâce à la propriété `meta` qui accepte un objet de propriétés et peut être accédé à l'emplacement de l'itinéraire et aux gardes de navigation. Vous pouvez définir les propriétés `meta` comme ceci :

```js
const routes = [
  {
    path: '/posts',
    component: PostsLayout,
    children: [
      {
        path: 'new',
        component: PostsNew,
        // seuls les utilisateurs authentifiés peuvent créer des messages
        meta: { requiresAuth: true }
      },
      {
        path: ':id',
        component: PostsDetail,
        // tout le monde peut lire un message
        meta: { requiresAuth: false }
      }
    ]
  }
]
```

Alors comment accéder à ce champ `meta` ?


<!-- TODO: l'explication sur les enregistrements d'itinéraire devrait être expliquée avant et les choses devraient être déplacées ici. -->

Premièrement, chaque objet route dans la configuration `routes` est appelé un **enregistrement de route**. Les enregistrements de routes peuvent être imbriqués. Par conséquent, lorsqu'une route est trouvée, elle peut potentiellement correspondre à plus d'un enregistrement de route.

Par exemple, avec la configuration de route ci-dessus, l'URL `/posts/new` correspondra à la fois à l'enregistrement de route parent (`path : '/posts'`) et à l'enregistrement de route enfant (`path : 'new'`).

Tous les enregistrements de route correspondant à une route sont exposés sur l'objet `$route` (et aussi les objets de route dans les gardes de navigation) comme le tableau `$route.matched`. Nous pourrions boucler à travers ce tableau pour vérifier tous les champs `meta`, mais Vue Router vous fournit également un `$route.meta` qui est une fusion non récursive de **tous les champs `meta`** du parent à l'enfant. Cela signifie que vous pouvez simplement écrire

```js
router.beforeEach((to, from) => {
  // au lieu de devoir vérifier chaque enregistrement de route avec
  // to.matched.some(record => record.meta.requiresAuth)
  if (to.meta.requiresAuth && !auth.isLoggedIn()) {
    // cette route nécessite une authentification, vérifiez si vous êtes connecté.
    // si non, redirige vers la page de connexion.
    return {
      path: '/login',
      // sauvegarder l'endroit où nous nous trouvons pour y revenir plus tard.
      query: { redirect: to.fullPath },
    }
  }
})
```

## TypeScript

Il est possible de saisir le champ méta en étendant l'interface `RouteMeta` :

```ts
// typings.d.ts or router.ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    // est facultatif
    isAdmin?: boolean
    // doit être déclaré par chaque route
    requiresAuth: boolean
  }
}
```
