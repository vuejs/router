# Redirection et alias

## Redirection


La redirection se fait également dans la configuration de `routes`. Pour rediriger de `/a` vers `/b` :

```js
const routes = [{ path: '/home', redirect: '/' }]
```

La redirection peut également viser une route nommée :

```js
const routes = [{ path: '/home', redirect: { name: 'homepage' } }]
```

Ou même utiliser une fonction de redirection dynamique :

```js
const routes = [
  {
    // /search/screens -> /search?q=screens
    path: '/search/:searchText',
    redirect: to => {
      // la fonction reçoit la route cible comme argument
      // nous retournons un chemin/emplacement de redirection ici.
      return { path: '/search', query: { q: to.params.searchText } }
    },
  },
  {
    path: '/search',
    // ...
  },
]
```

Notez que **[Les gardes de navigation](../advanced/navigation-guards.md) ne sont pas appliquées sur la route qui redirige, seulement sur sa cible**. Par exemple, dans l'exemple ci-dessus, ajouter une garde `beforeEnter` à la route `/home` n'aurait aucun effet.

Lorsque vous écrivez un `redirect`, vous pouvez omettre l'option `component` car il n'est jamais directement atteint et il n'y a donc pas de composant à rendre. La seule exception concerne les [routes imbriquées](./nested-routes.md) : si un enregistrement de route a des `children` et une propriété `redirect`, il doit aussi avoir une propriété `component`.

### Redirection relative

Il est également possible de rediriger vers un emplacement relatif :

```js
const routes = [
  {
    // redirigera toujours /users/123/posts vers /users/123/profile
    path: '/users/:id/posts',
    redirect: to => {
      // la fonction reçoit l'itinéraire cible comme argument
      // Un emplacement relatif ne commence pas par `/`.
      // ou { path : 'profile'}
      return 'profile'
    },
  },
]
```

## Alias

Une redirection signifie que lorsque l'utilisateur visite `/home`, l'URL sera remplacée par `/`, et ensuite correspondra à `/`. Mais qu'est-ce qu'un alias ?

**Un alias de `/` en tant que `/home` signifie que lorsque l'utilisateur visite `/home`, l'URL reste `/home`, mais elle sera comparée comme si l'utilisateur visitait `/`.**

Ce qui précède peut être exprimé dans la configuration de la route comme suit :

```js
const routes = [{ path: '/', component: Homepage, alias: '/home' }]
```

Un alias vous donne la liberté de faire correspondre une structure d'interface utilisateur à une URL arbitraire, au lieu d'être contraint par la structure d'imbrication de la configuration. Faites en sorte que l'alias commence par un `/` pour rendre le chemin absolu dans les routes imbriquées. Vous pouvez même combiner les deux et fournir plusieurs alias avec un tableau :

```js
const routes = [
  {
    path: '/users',
    component: UsersLayout,
    children: [
      // ceci rendra la UserList pour ces 3 URLs
      // - /users
      // - /users/list
      // - /people
      { path: '', component: UserList, alias: ['/people', 'list'] },
    ],
  },
]
```

Si votre itinéraire comporte des paramètres, veillez à les inclure dans tout alias absolu :

```js
const routes = [
  {
    path: '/users/:id',
    component: UsersByIdLayout,
    children: [
      // cela rendra les UserDetails pour ces 3 URLs
      // - /users/24
      // - /users/24/profile
      // - /24
      { path: 'profile', component: UserDetails, alias: ['/:id', ''] },
    ],
  },
]
```

**Remarque concernant le référencement** : lorsque vous utilisez des alias, veillez à [définir des liens canoniques](https://support.google.com/webmasters/answer/139066?hl=en).
