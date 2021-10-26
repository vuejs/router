# Comportement de défilement

<VueSchoolLink 
  href="https://vueschool.io/lessons/scroll-behavior"
  title="Learn how to customize scroll behavior"
/>

Lorsque l'on utilise le routage côté client, on peut vouloir faire défiler vers le haut lors de la navigation vers un nouvel itinéraire, ou préserver la position de défilement des entrées de l'historique comme le fait le rechargement réel de la page. Vue Router vous permet d'atteindre ces objectifs et, mieux encore, vous permet de personnaliser complètement le comportement de défilement lors de la navigation dans l'itinéraire.

**Note : cette fonctionnalité ne fonctionne que si le navigateur supporte `history.pushState`.**

Lors de la création de l'instance du routeur, vous pouvez fournir la fonction `scrollBehavior` :

```js
const router = createRouter({
  history: createWebHashHistory(),
  routes: [...],
  scrollBehavior (to, from, savedPosition) {
    // retourner la position désirée
  }
})
```

La fonction `scrollBehavior` reçoit les objets route `to` et `from`, comme [Navigation Guards](./navigation-guards.md). Le troisième argument, `savedPosition`, n'est disponible que s'il s'agit d'une navigation `popstate` (déclenchée par les boutons retour/avance du navigateur).

La fonction peut renvoyer un objet de position [`ScrollToOptions`](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions) :

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    // toujours faire défiler vers le haut
    return { top: 0 }
  },
})
```

Vous pouvez également passer un sélecteur CSS ou un élément DOM via `el`. Dans ce cas, `top` et `left` seront traités comme des décalages relatifs à cet élément.

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    // toujours faire défiler 10px au-dessus de l'élément #main
    return {
      // pourrait aussi être
      // el : document.getElementById('main'),
      el: '#main',
      top: -10,
    }
  },
})
```

Si une valeur erronée ou un objet vide est retourné, aucun défilement ne se produira.

Renvoyer la `savedPosition` donnera un comportement similaire à celui des natifs lors de la navigation avec les boutons avant/arrière :

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})
```

Si vous voulez simuler le comportement "scroll to anchor" :

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
      }
    }
  },
})
```

Si votre navigateur prend en charge le [comportement de défilement](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions/behavior), vous pouvez le rendre plus fluide :

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
  }
})
```

## Retarder le défilement

Parfois, nous devons attendre un peu avant de faire défiler la page. Par exemple, lorsqu'il s'agit de transitions, nous voulons attendre que la transition se termine avant de faire défiler la page. Pour ce faire, vous pouvez renvoyer une Promise qui renvoie le descripteur de position souhaité. Voici un exemple où nous attendons 500 ms avant de faire défiler la page :

```js
const router = createRouter({
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ left: 0, top: 0 })
      }, 500)
    })
  },
})
```

Il est possible de l'associer à des événements provenant d'un composant de transition de niveau page pour que le comportement de défilement s'accorde avec les transitions de votre page, mais en raison de la variance et de la complexité possibles des cas d'utilisation, nous fournissons simplement cette primitive pour permettre des implémentations spécifiques de l'userland.
