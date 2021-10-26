# Routes de chargement paresseux

<VueSchoolLink 
  href="https://vueschool.io/lessons/lazy-loading-routes-vue-cli-only"
  title="Learn about lazy loading routes"
/>

Lors de la création d'applications avec un bundler, le bundle JavaScript peut devenir assez volumineux et affecter ainsi le temps de chargement de la page. Il serait plus efficace de diviser les composants de chaque route en morceaux séparés, et de ne les charger que lorsque la route est visitée.

Vue Router prend en charge les [importations dynamiques](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Dynamic_Imports) dès le départ, ce qui signifie que vous pouvez remplacer les importations statiques par des importations dynamiques :

```js
// remplacer
// importation de UserDetails à partir de './views/UserDetails'.
// avec
const UserDetails = () => import('./views/UserDetails')

const router = createRouter({
  // ...
  routes: [{ path: '/users/:id', component: UserDetails }],
})
```

L'option `component` (et `components`) accepte une fonction qui renvoie une Promise d'un composant et Vue Router **ne le récupérera que lorsqu'il entrera dans la page pour la première fois**, puis utilisera la version en cache. Ce qui signifie que vous pouvez aussi avoir des fonctions plus complexes tant qu'elles retournent une Promise :

```js
const UserDetails = () =>
  Promise.resolve({
    /* définition du composant */
  })
```

En général, c'est une bonne idée **de toujours utiliser les importations dynamiques** pour toutes vos routes.

::: tip Note
N'utilisez **pas** les [composants asynchrones](https://v3.vuejs.org/guide/component-dynamic-async.html#async-components) pour les routes. Les composants asynchrones peuvent toujours être utilisés dans les composants de route, mais les composants de route eux-mêmes ne sont que des importations dynamiques.
:::

Si vous utilisez un bundler comme webpack, vous bénéficierez automatiquement de [code splitting](https://webpack.js.org/guides/code-splitting/).

Si vous utilisez Babel, vous devrez ajouter le plugin [syntax-dynamic-import](https://babeljs.io/docs/plugins/syntax-dynamic-import/) pour que Babel puisse analyser correctement la syntaxe.

## Regroupement des composants dans le même chunk

Parfois, nous pouvons vouloir regrouper tous les composants imbriqués sous la même route dans le même chunk asynchrone. Pour ce faire, nous devons utiliser [named chunks](https://webpack.js.org/guides/code-splitting/#dynamic-imports) en fournissant un nom de chunk à l'aide d'une syntaxe de commentaire spéciale (nécessite webpack > 2.4) :

```js
const UserDetails = () =>
  import(/* webpackChunkName: "group-user" */ './UserDetails.vue')
const UserDashboard = () =>
  import(/* webpackChunkName: "group-user" */ './UserDashboard.vue')
const UserProfileEdit = () =>
  import(/* webpackChunkName: "group-user" */ './UserProfileEdit.vue')
```

webpack regroupera tout module asynchrone ayant le même nom de chunk dans le même chunk asynchrone.
