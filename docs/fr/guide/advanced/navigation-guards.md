# Gardes de navigation

Comme son nom l'indique, les gardes de navigation fournies par Vue router sont principalement utilisées pour garder les navigations soit en les redirigeant, soit en les annulant. Il y a un certain nombre de façons de s'accrocher au processus de navigation de la route : globalement, par route, ou dans le composant.

## Avant les Gardes en globale

Vous pouvez enregistrer des gardes globales avant en utilisant `router.beforeEach` :

```js
const router = createRouter({ ... })

router.beforeEach((to, from) => {
  // ...
  // retourner explicitement false pour annuler la navigation
  return false
})
```

Les gardes globales avant sont appelées dans l'ordre de création, chaque fois qu'une navigation est déclenchée. Les gardes peuvent être résolues de manière asynchrone, et la navigation est considérée comme **en attente** avant que tous les crochets aient été résolus.

Chaque fonction de garde reçoit deux arguments :

- **`to`** : l'emplacement de l'itinéraire cible [dans un format normalisé](../../api/#routelocationnormalized) vers lequel on navigue.
- **`from`** : l'emplacement actuel de l'itinéraire [dans un format normalisé](../../api/#routelocationnormalized) vers lequel on navigue.

Et peut éventuellement renvoyer l'une des valeurs suivantes :

- `false` : annule la navigation en cours. Si l'URL du navigateur a été modifiée (soit manuellement par l'utilisateur, soit via le bouton retour), elle sera réinitialisée à celle de l'itinéraire `from`.
- Un [emplacement de l'itinéraire](../../api/#routelocationraw) : Rediriger vers un emplacement différent en passant un emplacement de route comme si vous appeliez [`router.push()`](../../api/#push), ce qui vous permet de passer des options comme `replace : true` ou `name : 'home'`. La navigation actuelle est abandonnée et une nouvelle est créée avec le même `from`.

Il est également possible de lancer un `Error` si une situation inattendue a été rencontrée. Cela annulera également la navigation et appellera tout callback enregistré via [`router.onError()`](../../api/#onerror).

Si rien, `undefined` ou `true` n'est retourné, **la navigation est validée**, et la prochaine garde de navigation est appelée.

Tout ce qui précède **fonctionne de la même manière avec les fonctions `async`** et les Promises :

```js
router.beforeEach(async (to, from) => {
  // canUserAccess() retourne `vrai` ou `faux`.
  const canAccess = await canUserAccess(to)
  if (!canAccess) return '/login'
})
```

### Troisième argument optionnel `next`

Dans les versions précédentes de Vue Router, il était également possible d'utiliser un troisième argument `next`, c'était une source fréquente d'erreurs et a fait l'objet d'un [RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0037-router-return-guards.md#motivation) pour le supprimer. Cependant, il est toujours supporté, ce qui signifie que vous pouvez passer un troisième argument à n'importe quelle garde de navigation. Dans ce cas, **vous devez appeler `next` exactement une fois** dans chaque passage par un garde de navigation. Il peut apparaître plus d'une fois, mais seulement si les chemins logiques ne se chevauchent pas, sinon le hook ne sera jamais résolu ou produira des erreurs. Voici **un mauvais exemple** de redirection d'un utilisateur vers `/login` s'il n'est pas authentifié :

```js
// BAD
router.beforeEach((to, from, next) => {
  if (to.name !== 'Login' && !isAuthenticated) next({ name: 'Login' })
  // si l'utilisateur n'est pas authentifié, `next` est appelé deux fois
  next()
})
```

Voici la version correcte :

```js
// GOOD
router.beforeEach((to, from, next) => {
  if (to.name !== 'Login' && !isAuthenticated) next({ name: 'Login' })
  else next()
})
```

## Les Gardes globales de résolution

Vous pouvez enregistrer un garde globale avec `router.beforeResolve`. C'est similaire à `router.beforeEach` parce qu'il se déclenche sur **chaque navigation**, mais les gardes de résolution sont appelées juste avant que la navigation soit confirmée, **après que toutes les gardes dans les composants et les composants de route asynchrones soient résolus**. Voici un exemple qui garantit que l'utilisateur a donné accès à la caméra pour les routes qui [ont défini une méta personnalisée](./meta.md) propriété `requiresCamera` :

```js
router.beforeResolve(async to => {
  if (to.meta.requiresCamera) {
    try {
      await askForCameraPermission()
    } catch (error) {
      if (error instanceof NotAllowedError) {
        // ... gérer l'erreur et ensuite annuler la navigation
        return false
      } else {
        // erreur inattendue, annule la navigation et passe l'erreur au gestionnaire global
        throw error
      }
    }
  }
})
```

`router.beforeResolve` est l'endroit idéal pour récupérer des données ou effectuer toute autre opération que vous voulez éviter de faire si l'utilisateur ne peut pas entrer dans une page.

<!-- TODO: comment combiner avec les [champs `meta`](./meta.md) pour créer un [mécanisme de récupération générique](#TODO). -->

## Les Crochets globaux After

Vous pouvez également enregistrer des hooks globaux after, mais contrairement aux gardes, ces hooks n'ont pas de fonction `next` et ne peuvent pas affecter la navigation :

```js
router.afterEach((to, from) => {
  sendToAnalytics(to.fullPath)
})
```

<!-- TODO: peut-être ajouter des liens vers des exemples -->

Ils sont utiles pour l'analyse, la modification du titre de la page, les fonctions d'accessibilité comme l'annonce de la page et bien d'autres choses.

Ils reflètent également les [échecs de navigation](./navigation-failures.md) comme troisième argument :

```js
router.afterEach((to, from, failure) => {
  if (!failure) sendToAnalytics(to.fullPath)
})
```

Pour en savoir plus sur les échecs de navigation, consultez [son guide](./navigation-failures.md).

## Un Garde par route

Vous pouvez définir des gardes `beforeEnter` directement sur l'objet de configuration d'une route :

```js
const routes = [
  {
    path: '/users/:id',
    component: UserDetails,
    beforeEnter: (to, from) => {
       // rejeter la navigation
      return false
    },
  },
]
```

Les gardes `beforeEnter` **se déclenchent uniquement lors de l'entrée dans l'itinéraire**, elles ne se déclenchent pas lorsque les `params`, `query` ou `hash` changent, par exemple en passant de `/users/2` à `/users/3` ou en passant de `/users/2#info` à `/users/2#projects`. Ils ne sont déclenchés que lorsque vous naviguez **à partir d'une route différente**.

Vous pouvez également passer un tableau de fonctions à `beforeEnter`, ceci est utile lorsque vous réutilisez des gardes pour différentes routes :

```js
function removeQueryParams(to) {
  if (Object.keys(to.query).length)
    return { path: to.path, query: {}, hash: to.hash }
}

function removeHash(to) {
  if (to.hash) return { path: to.path, query: to.query, hash: '' }
}

const routes = [
  {
    path: '/users/:id',
    component: UserDetails,
    beforeEnter: [removeQueryParams, removeHash],
  },
  {
    path: '/about',
    component: UserDetails,
    beforeEnter: [removeQueryParams],
  },
]
```

Notez qu'il est possible d'obtenir un comportement similaire en utilisant les [champs méta de la route](./meta.md) et les [gardes de navigation globale](#global-before-guards).

## Les Gardes à l'intérieur des composants

Enfin, vous pouvez définir directement des gardes de navigation à l'intérieur des composants de route (ceux passés à la configuration du routeur)

### Utilisation de l'API d'options

Vous pouvez ajouter les options suivantes aux composants de route :

- `beforeRouteEnter`
- `beforeRouteUpdate`
- `beforeRouteLeave`

```js
const UserDetails = {
  template: `...`,
  beforeRouteEnter(to, from) {
    // appelé avant que la route qui rend ce composant soit confirmée.
    // n'a PAS accès à l'instance du composant `this`,
    // car elle n'a pas encore été créée lorsque cette garde est appelée !
  },
  beforeRouteUpdate(to, from) {
    // appelé lorsque la route qui rend ce composant a changé,
    // mais ce composant est réutilisé dans la nouvelle route.
    // Par exemple, pour une route avec les paramètres `/users/:id`, lorsque nous
    // naviguons entre `/users/1` et `/users/2`, la même instance du composant `UserDetails` sera réutilisée.
    // sera réutilisée, et ce hook sera appelé à ce moment-là.
    // Comme le composant est monté pendant que cela se produit, le garde de navigation a accès à `cette` instance de composant.
  },
  beforeRouteLeave(to, from) {
    // appelé lorsque la route qui rend ce composant est sur le point de
    // être éloigné de la route.
    // Comme pour `beforeRouteUpdate`, il a accès à l'instance du composant `this`.
  },
}
```

Le garde `beforeRouteEnter` n'a **PAS** accès à `this`, car le garde est appelé avant que la navigation ne soit confirmée, donc le nouveau composant entrant n'a même pas encore été créé.

Cependant, vous pouvez accéder à l'instance en passant une callback à `next`. La callback sera appelée lorsque la navigation sera confirmée, et l'instance du composant sera passée à la callback comme argument :

```js
beforeRouteEnter (to, from, next) {
  next(vm => {
    // accès à l'instance publique du composant via `vm`.
  })
}
```

Notez que `beforeRouteEnter` est la seule garde qui supporte de passer un callback à `next`. Pour `beforeRouteUpdate` et `beforeRouteLeave`, `this` est déjà disponible, donc passer un callback est inutile et donc _non supporté_ :

```js
beforeRouteUpdate (to, from) {
  // utilisez simplement `this`
  this.name = to.params.name
}
```

La **protection contre le départ** est généralement utilisée pour empêcher l'utilisateur de quitter accidentellement l'itinéraire avec des modifications non sauvegardées. La navigation peut être annulée en retournant `false`.


```js
beforeRouteLeave (to, from) {
  const answer = window.confirm('Do you really want to leave? you have unsaved changes!')
  if (!answer) return false
}
```

### Utilisation de l'API de composition

Si vous écrivez votre composant en utilisant l'[API de composition et une fonction `setup`](https://v3.vuejs.org/guide/composition-api-setup.html#setup), vous pouvez ajouter des gardes de mise à jour et de départ par le biais de `onBeforeRouteUpdate` et `onBeforeRouteLeave` respectivement. Veuillez consulter la section [Composition API](./composition-api.md#navigation-guards) pour plus de détails.

## Le flux complet de résolution de la navigation

1. Navigation déclenchée.
2. Appel des gardes `beforeRouteLeave` dans les composants désactivés.
3. Appel des gardes globales `beforeEach`.
4. Appeler les gardes `beforeRouteUpdate` dans les composants réutilisés.
5. Appeler les gardes `beforeEnter` dans les configurations de route.
6. Résoudre les composants de route asynchrones.
7. Appeler `beforeRouteEnter` dans les composants activés.
8. Appeler les gardes globales `beforeResolve`.
9. La navigation est confirmée.
10. Appelle les crochets globaux `afterEach`.
11. Les mises à jour du DOM sont déclenchées.
12. Appel des callbacks passés à `next` dans les gardes `beforeRouteEnter` avec les instances instanciées.
