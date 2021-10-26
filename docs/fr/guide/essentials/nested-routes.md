# Routes imbriquées

<VueSchoolLink 
  href="https://vueschool.io/lessons/nested-routes"
  title="Learn about nested routes"
/>

Les interfaces utilisateur de certaines applications sont composées de composants imbriqués sur plusieurs niveaux. Dans ce cas, il est très courant que les segments d'une URL correspondent à une certaine structure de composants imbriqués, par exemple :

```
/user/johnny/profile                     /user/johnny/posts
+------------------+                  +-----------------+
| User             |                  | User            |
| +--------------+ |                  | +-------------+ |
| | Profile      | |  +------------>  | | Posts       | |
| |              | |                  | |             | |
| +--------------+ |                  | +-------------+ |
+------------------+                  +-----------------+
```

Avec Vue Router, vous pouvez exprimer cette relation en utilisant des configurations de routes imbriquées.

Compte tenu de l'application que nous avons créée dans le dernier chapitre :

```html
<div id="app">
  <router-view></router-view>
</div>
```

```js
const User = {
  template: '<div>User {{ $route.params.id }}</div>',
}

// ils sont passés à `createRouter`.
const routes = [{ path: '/user/:id', component: User }]
```

Le `<router-view>` ici est un `router-view` de haut niveau. Elle rend le composant correspondant à une route de niveau supérieur. De la même manière, un composant rendu peut également contenir son propre `<router-view>`, imbriqué. Par exemple, si nous en ajoutons un à l'intérieur du modèle du composant `User` :

```js
const User = {
  template: `
    <div class="user">
      <h2>User {{ $route.params.id }}</h2>
      <router-view></router-view>
    </div>
  `,
}
```

Pour rendre les composants dans cette `router-view` imbriquée, nous devons utiliser l'option `children` dans n'importe quelle route :

```js
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      {
        // UserProfile sera rendu à l'intérieur du <router-view> de l'utilisateur.
        // quand /user/:id/profile est trouvé
        path: 'profile',
        component: UserProfile,
      },
      {
        // Les UserPosts seront rendus à l'intérieur de la <router-view> de l'utilisateur.
        // quand /user/:id/posts est trouvé
        path: 'posts',
        component: UserPosts,
      },
    ],
  },
]
```

**Notez que les chemins imbriqués qui commencent par `/` seront traités comme un chemin racine. Cela vous permet de tirer parti de l'imbrication des composants sans avoir à utiliser une URL imbriquée.**

Comme vous pouvez le voir, l'option `children` est juste un autre tableau de routes comme `routes` lui-même. Par conséquent, vous pouvez continuer à imbriquer les vues autant que vous le souhaitez.

A ce stade, avec la configuration ci-dessus, lorsque vous visitez `/user/eduardo`, rien ne sera rendu à l'intérieur de la `router-view` de `User`, parce qu'aucune route imbriquée ne correspond. Peut-être que vous voulez rendre quelque chose à cet endroit. Dans ce cas, vous pouvez fournir un chemin imbriqué vide :

```js
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      // UserHome sera rendu à l'intérieur du <router-view> de l'utilisateur.
      // lorsque /user/:id est trouvé
      { path: '', component: UserHome },

      // ...autres sous-itinéraires
    ],
  },
]
```

Une démonstration fonctionnelle de cet exemple peut être trouvée [ici](https://codesandbox.io/s/nested-views-vue-router-4-examples-hl326?initialpath=%2Fusers%2Feduardo).
