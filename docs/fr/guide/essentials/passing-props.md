# Passer des accessoires aux composants de l'itinéraire

<VueSchoolLink 
  href="https://vueschool.io/lessons/route-props"
  title="Learn how to pass props to route components"
/>

L'utilisation de `$route` dans votre composant crée un couplage étroit avec la route qui limite la flexibilité du composant car il ne peut être utilisé que sur certaines URLs. Bien que ce ne soit pas nécessairement une mauvaise chose, nous pouvons découpler ce comportement avec une option `props` :

Nous pouvons remplacer

```js
const User = {
  template: '<div>User {{ $route.params.id }}</div>'
}
const routes = [{ path: '/user/:id', component: User }]
```

avec

```js
const User = {
  // assurez-vous d'ajouter un prop nommé exactement comme le paramètre de la route.
  props: ['id'],
  template: '<div>User {{ id }}</div>'
}
const routes = [{ path: '/user/:id', component: User, props: true }]
```

Cela vous permet d'utiliser le composant n'importe où, ce qui rend le composant plus facile à réutiliser et à tester.

## Mode booléen

Quand `props` est mis à `true`, le `route.params` sera mis comme props du composant..

## Vues nommées

Pour les routes avec des vues nommées, vous devez définir l'option `props` pour chaque vue nommée :

```js
const routes = [
  {
    path: '/user/:id',
    components: { default: User, sidebar: Sidebar },
    props: { default: true, sidebar: false }
  }
]
```

## Mode objet

Lorsque `props` est un objet, il sera défini comme le composant props tel quel. Utile lorsque les props sont statiques.

```js
const routes = [
  {
    path: '/promotion/from-newsletter',
    component: Promotion,
    props: { newsletterPopup: false }
  }
]
```

## Mode fonction

Vous pouvez créer une fonction qui renvoie des props. Cela vous permet de convertir des paramètres en d'autres types, de combiner des valeurs statiques avec des valeurs basées sur les routes, etc.

```js
const routes = [
  {
    path: '/search',
    component: SearchUser,
    props: route => ({ query: route.query.q })
  }
]
```

L'URL `/search?q=vue` transmettrait `{query : 'vue'}` comme props au composant `SearchUser`.

Essayez de garder la fonction `props` sans état, car elle n'est évaluée que lors des changements de route. Utilisez un composant wrapper si vous avez besoin d'un état pour définir les props, de cette façon vue peut réagir aux changements d'état.

Pour une utilisation avancée, consultez le [exemple](https://github.com/vuejs/vue-router/blob/dev/examples/route-props/app.js).
