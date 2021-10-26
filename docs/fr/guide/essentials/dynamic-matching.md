# Correspondance dynamique des routes avec les paramètres

<VueSchoolLink 
  href="https://vueschool.io/lessons/dynamic-routes"
  title="Learn about dynamic route matching with params"
/>

Très souvent, nous aurons besoin de faire correspondre des routes avec le modèle donné au même composant. Par exemple, nous pouvons avoir un composant `User` qui doit être rendu pour tous les utilisateurs mais avec des identifiants différents. Dans Vue Router, nous pouvons utiliser un segment dynamique dans le chemin pour réaliser cela, nous l'appelons un _param_ :

```js
const User = {
  template: '<div>User</div>',
}

// ils sont passés à `createRouter`.
const routes = [
  // les segments dynamiques commencent par un deux-points
  { path: '/users/:id', component: User },
]
```

Maintenant, des URLs comme `/users/johnny` et `/users/jolyne` mèneront toutes deux à la même route.

Un _param_ est indiqué par deux points `:`. Lorsqu'une route est trouvée, la valeur de ses _paramètres_ sera exposée comme `this.$route.params` dans chaque composant. Par conséquent, nous pouvons rendre l'ID de l'utilisateur actuel en mettant à jour le modèle de `User` avec ceci :

```js
const User = {
  template: '<div>User {{ $route.params.id }}</div>',
}
```

Vous pouvez avoir plusieurs _params_ dans la même route, et ils correspondront aux champs correspondants dans `$route.params`. Exemples :

| modèle                        | chemin correspondant             | \$route.params                           |
| ------------------------------ | ------------------------ | ---------------------------------------- |
| /users/:username               | /users/eduardo           | `{ username: 'eduardo' }`                |
| /users/:username/posts/:postId | /users/eduardo/posts/123 | `{ username: 'eduardo', postId: '123' }` |

En plus de `$route.params`, l'objet `$route` expose également d'autres informations utiles telles que `$route.query` (s'il y a une requête dans l'URL), `$route.hash`, etc. Vous pouvez consulter tous les détails dans la [Référence API](../../api/#routelocationnormalized).

Une démonstration fonctionnelle de cet exemple peut être trouvée [ici](https://codesandbox.io/s/route-params-vue-router-examples-mlb14?from-embed&initialpath=%2Fusers%2Feduardo%2Fposts%2F1).

<!-- <iframe
  src="https://codesandbox.io/embed//route-params-vue-router-examples-mlb14?fontsize=14&theme=light&view=preview&initialpath=%2Fusers%2Feduardo%2Fposts%2F1"
  style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
  title="Route Params example"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe> -->

## Réagir aux changements de paramètres

<VueSchoolLink 
  href="https://vueschool.io/lessons/reacting-to-param-changes"
  title="Learn how to react to param changes"
/>

Une chose à noter lors de l'utilisation de routes avec des paramètres est que lorsque l'utilisateur navigue de `/users/johnny` à `/users/jolyne`, **la même instance de composant sera réutilisée**. Comme les deux routes rendent le même composant, c'est plus efficace que de détruire l'ancienne instance et d'en créer une nouvelle. **Cependant, cela signifie également que les hooks du cycle de vie du composant ne seront pas appelés**.

Pour réagir aux changements de paramètres dans le même composant, vous pouvez simplement surveiller n'importe quoi sur l'objet `$route`, dans ce scénario, le `$route.params` :

```js
const User = {
  template: '...',
  created() {
    this.$watch(
      () => this.$route.params,
      (toParams, previousParams) => {
        // réagir aux changements de route...

      }
    )
  },
}
```

Vous pouvez aussi utiliser le [garde de navigation] `beforeRouteUpdate`(../advanced/navigation-guards.md), qui permet également d'annuler la navigation :

```js
const User = {
  template: '...',
  async beforeRouteUpdate(to, from) {
    // réagir aux changements de route...
    this.userData = await fetchUser(to.params.id)
  },
}
```

## Catch all / 404 Not found Route

<VueSchoolLink 
  href="https://vueschool.io/lessons/404-not-found-page"
  title="Learn how to make a catch all/404 not found route"
/>

Les paramètres réguliers ne correspondent qu'aux caractères situés entre les fragments d'url, séparés par des `/`. Si nous voulons faire correspondre **tout**, nous pouvons utiliser une regexp _param_ personnalisée en ajoutant la regexp entre parenthèses juste après le _param_ :

```js
const routes = [
  // va tout faire correspondre et le mettre sous `$route.params.pathMatch`.
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  // correspondra à tout ce qui commence par `/user-` et le mettra sous `$route.params.afterUser`.
  { path: '/user-:afterUser(.*)', component: UserGeneric },
]
```

Dans ce scénario spécifique, nous utilisons un [regexp personnalisé](./route-matching-syntax.md#custom-regexp-in-params) entre parenthèses et marquons le paramètre `pathMatch` comme [optional repeatable](./route-matching-syntax.md#optional-parameters). Cela nous permet de naviguer directement vers la route si nous en avons besoin en divisant le `path` en un tableau :

```js
this.$router.push({
  name: 'NotFound',
  // conserve le chemin actuel et supprime le premier caractère pour éviter que l'URL cible ne commence par `//`.
  params: { pathMatch: this.$route.path.substring(1).split('/') },
  // préserver la requête existante et le hachage s'il y en a un
  query: this.$route.query,
  hash: this.$route.hash,
})
```

Si vous utilisez [History mode](./history-mode.md), veillez à suivre les instructions pour configurer correctement votre serveur.

## Patterns de correspondance avancés

Vue Router utilise sa propre syntaxe de correspondance de chemin, inspirée de celle utilisée par `express`, il supporte donc de nombreux modèles de correspondance avancés tels que les paramètres optionnels, zéro ou plus / une ou plusieurs exigences, et même des modèles regex personnalisés. Veuillez consulter la documentation [Advanced Matching](./route-matching-syntax.md) pour les explorer.
