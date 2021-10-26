# Routage dynamique

L'ajout de routes à votre routeur se fait généralement via l'option [`routes`](../../api/#routes) mais dans certaines situations, vous pourriez vouloir ajouter ou supprimer des routes alors que l'application est déjà en cours d'exécution. Les applications dotées d'interfaces extensibles comme [Vue CLI UI](https://cli.vuejs.org/dev-guide/ui-api.html) peuvent utiliser cette fonction pour faire évoluer l'application.

## Ajouter des routes

Le routage dynamique est réalisé principalement via deux fonctions : `router.addRoute()` et `router.removeRoute()`. Elles **seulement** enregistrent une nouvelle route, ce qui signifie que si la nouvelle route ajoutée correspond à l'emplacement actuel, il vous faudra **manuellement naviguer** avec `router.push()` ou `router.replace()` pour afficher cette nouvelle route. Prenons un exemple :

Imaginez que vous ayez le routeur suivant avec une seule route :

```js
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:articleName', component: Article }],
})
```

Aller sur n'importe quelle page, `/about`, `/store`, ou `/3-tricks-to-improve-your-routing-code` finit par rendre le composant `Article`. Si nous sommes sur `/about` et que nous ajoutons une nouvelle route :

```js
router.addRoute({ path: '/about', component: About })
```

La page affichera toujours le composant `Article`, nous devons appeler manuellement `router.replace()` pour changer l'emplacement actuel et écraser où nous étions (au lieu de pousser une nouvelle entrée, se retrouvant au même endroit deux fois dans notre historique) :

```js
router.addRoute({ path: '/about', component: About })
// on pourrait aussi utiliser this.$route ou route = useRoute() (à l'intérieur d'un setup)
router.replace(router.currentRoute.value.fullPath)
```

Rappelez-vous que vous pouvez `await router.replace()` si vous devez attendre que la nouvelle route soit affichée.

## Ajouter des routes à l'intérieur des gardes de navigation

Si vous décidez d'ajouter ou de supprimer des routes à l'intérieur d'une garde de navigation, vous ne devez pas appeler `router.replace()` mais déclencher une redirection en retournant le nouvel emplacement :

```js
router.beforeEach(to => {
  if (!hasNecessaryRoute(to)) {
    router.addRoute(generateRoute(to))
    // déclenche une redirection
    return to.fullPath
  }
})
```

L'exemple ci-dessus suppose deux choses : premièrement, l'enregistrement de la route nouvellement ajoutée correspondra à l'emplacement `to`, ce qui donnera effectivement un emplacement différent de celui auquel nous essayions d'accéder. Deuxièmement, `hasNecessaryRoute()` renvoie `false` après avoir ajouté la nouvelle route pour éviter une redirection infinie.

Parce que nous redirigeons, nous remplaçons la navigation en cours, et nous nous comportons effectivement comme dans l'exemple précédent. Dans les scénarios du monde réel, l'ajout est plus susceptible de se produire en dehors des gardes de navigation, par exemple quand un composant de vue se monte, il enregistre de nouvelles routes.

## Supprimer des routes

Il y a plusieurs façons de supprimer des routes existantes :

- En ajoutant une route avec un nom conflictuel. Si vous ajoutez un itinéraire qui a le même nom qu'un itinéraire existant, il supprimera d'abord l'itinéraire et ajoutera ensuite l'itinéraire :
  ```js
  router.addRoute({ path: '/about', name: 'about', component: About })
  // ceci supprimera la route précédemment ajoutée car elles ont le même nom et les noms sont uniques.
  router.addRoute({ path: '/other', name: 'about', component: Other })
  ```
- En appelant le callback retourné par `router.addRoute()` :
  ```js
  const removeRoute = router.addRoute(routeRecord)
  removeRoute() // supprime la route si elle existe
  ```
  Ceci est utile lorsque les routes n'ont pas de nom.
- En utilisant `router.removeRoute()` pour supprimer une route par son nom :
  ```js
  router.addRoute({ path: '/about', name: 'about', component: About })
  // remove the route
  router.removeRoute('about')
  ```
  Notez que vous pouvez utiliser `Symbol` pour les noms dans les routes si vous souhaitez utiliser cette fonction mais voulez éviter les conflits dans les noms.

Lorsqu'une route est supprimée, **tous ses alias et enfants** sont supprimés avec elle.

## Ajouter des routes imbriquées

Pour ajouter des routes imbriquées à une route existante, vous pouvez passer le _nom_ de la route comme premier paramètre à `router.addRoute()`, ceci ajoutera effectivement la route comme si elle était ajoutée par `children` :

```js
router.addRoute({ name: 'admin', path: '/admin', component: Admin })
router.addRoute('admin', { path: 'settings', component: AdminSettings })
```

Ceci est équivalent à :

```js
router.addRoute({
  name: 'admin',
  path: '/admin',
  component: Admin,
  children: [{ path: 'settings', component: AdminSettings }],
})
```

## Regarder les routes existantes

Vue Router vous donne deux fonctions pour regarder les routes existantes :

- [`router.hasRoute()`](../../api/#hasroute) : vérifie si une route existe.
- [`router.getRoutes()`](../../api/#getroutes) : obtient un tableau avec tous les enregistrements de routes.
