# Attendre le résultat d'une navigation

Lorsque vous utilisez `router-link`, Vue Router appelle `router.push` pour déclencher une navigation. Alors que le comportement attendu pour la plupart des liens est de faire naviguer un utilisateur vers une nouvelle page, il y a quelques situations où les utilisateurs resteront sur la même page :

- Les utilisateurs sont déjà sur la page vers laquelle ils essaient de naviguer.
- Une [garde de navigation](./navigation-guards.md) interrompt la navigation en faisant `return false`.
- Une nouvelle garde de navigation a lieu alors que la précédente n'est pas terminée.
- Un [garde de navigation](./navigation-guards.md) redirige vers un autre endroit en renvoyant un nouvel emplacement (par exemple, `return '/login'`).
- Un [garde de navigation](./navigation-guards.md) génère une `Error`.

Si nous voulons faire quelque chose après qu'une navigation soit terminée, nous avons besoin d'un moyen d'attendre après avoir appelé `router.push`. Imaginons que nous ayons un menu mobile qui nous permet d'aller sur différentes pages et que nous voulions seulement cacher le menu une fois que nous avons navigué vers la nouvelle page, nous pourrions faire quelque chose comme ceci :

```js
router.push('/my-profile')
this.isMenuOpen = false
```

Mais cela fermera le menu immédiatement car **les navigations sont asynchrones**, nous devons `await` la promesse retournée par `router.push` :

```js
await router.push('/my-profile')
this.isMenuOpen = false
```

Maintenant, le menu se ferme une fois la navigation terminée, mais il se ferme aussi si la navigation a été empêchée. Nous avons besoin d'un moyen de détecter si nous avons réellement changé la page sur laquelle nous sommes ou non.

## Détection des échecs de navigation

Si une navigation est empêchée et que l'utilisateur reste sur la même page, la valeur résolue de la promesse retournée par `router.push` sera un _Échec de navigation_. Sinon, ce sera une valeur _falsy_ (généralement `undefined`). Cela nous permet de différencier le cas où nous avons navigué loin de l'endroit où nous sommes ou pas :

```js
const navigationResult = await router.push('/my-profile')

if (navigationResult) {
  // navigation empêchée
} else {
  // la navigation a réussi (cela inclut le cas d'une redirection)
  this.isMenuOpen = false
}
```

_Navigation Failures_ sont des instances `Error` avec quelques propriétés supplémentaires qui nous donnent suffisamment d'informations pour savoir quelle navigation a été empêchée et pourquoi. Pour vérifier la nature d'un résultat de navigation, utilisez la fonction `isNavigationFailure` :

```js
import { NavigationFailureType, isNavigationFailure } from 'vue-router'

// tentative de quitter la page d'édition d'un article sans l'enregistrer
const failure = await router.push('/articles/2')

if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
  // montrer une petite notification à l'utilisateur
  showToast('You have unsaved changes, discard and leave anyway?')
}
```

::: tip
Si vous omettez le deuxième paramètre : `isNavigationFailure(failure)`, il vérifiera uniquement si `failure` est un _Échecs de navigation_.
:::

## Différenciation des échecs de navigation

Comme nous l'avons dit au début, il y a différentes situations d'abandon de la navigation, toutes résultant en différents _Échecs de navigation_. On peut les différencier en utilisant les paramètres `isNavigationFailure` et `NavigationFailureType`. Il existe trois types différents :

- `aborted` : `false` a été retourné à l'intérieur d'un garde de navigation à la navigation.
- `cancelled` : Une nouvelle navigation a eu lieu avant que la navigation en cours ne soit terminée. Par exemple, `router.push` a été appelé alors qu'il attendait à l'intérieur d'un garde de navigation.
- `duplicated` : La navigation a été empêchée car nous sommes déjà à l'emplacement cible.

## Propriétés de _Navigation Failures_ (échecs de navigation)

Tous les échecs de navigation exposent les propriétés `to` et `from` pour refléter l'emplacement actuel ainsi que l'emplacement cible pour la navigation qui a échoué :

```js
// essayant d'accéder à la page d'administration

router.push('/admin').then(failure => {
  if (isNavigationFailure(failure, NavigationFailureType.redirected)) {
    failure.to.path // '/admin'
    failure.from.path // '/'
  }
})
```

Dans tous les cas, `to` et `from` sont des emplacements de route normalisés.

## Détection des redirections

Lorsque l'on retourne un nouvel emplacement à l'intérieur d'un garde de navigation, on déclenche une nouvelle navigation qui remplace celle en cours. A la différence des autres valeurs de retour, une redirection n'empêche pas une navigation, **elle en crée une nouvelle**. Elle est donc vérifiée différemment, en lisant la propriété `redirectedFrom` dans une Route Location :

```js
await router.push('/my-profile')
if (router.currentRoute.value.redirectedFrom) {
  // redirectedFrom est un emplacement de route résolu comme to et from dans les gardes de navigation.
}
```
