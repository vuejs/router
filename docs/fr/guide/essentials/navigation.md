---
sidebarDepth: 0
---

# Navigation programmatique

En plus d'utiliser `<router-link>` pour créer des balises d'ancrage pour la navigation déclarative, nous pouvons le faire de manière programmatique en utilisant les méthodes d'instance du routeur.

## Naviguer vers un autre endroit

**Remarque : à l'intérieur d'une instance Vue, vous avez accès à l'instance du routeur en tant que `$router`. Vous pouvez donc appeler `this.$router.push`.**

Pour naviguer vers une autre URL, utilisez `router.push`. Cette méthode pousse une nouvelle entrée dans la pile de l'historique, de sorte que lorsque l'utilisateur clique sur le bouton retour du navigateur, il sera ramené à l'URL précédente.

C'est la méthode appelée en interne lorsque vous cliquez sur un `<router-link>`, donc cliquer sur `<router-link :to="...">` équivaut à appeler `router.push(...)`.

| Declarative               | Programme       |
| ------------------------- | ------------------ |
| `<router-link :to="...">` | `router.push(...)` |

L'argument peut être un chemin d'accès de type chaîne de caractères, ou un objet descripteur d'emplacement. Exemples :

```js
// chemin de la chaîne littérale
router.push('/users/eduardo')

// objet avec chemin
router.push({ path: '/users/eduardo' })

// route nommée avec des paramètres pour permettre au routeur de construire l'url.
router.push({ name: 'user', params: { username: 'eduardo' } })

// avec la requête, ce qui donne /register?plan=private
router.push({ path: '/register', query: { plan: 'private' } })

// avec hash, ce qui donne /about#team
router.push({ path: '/about', hash: '#team' })
```

**Note** : `params` sont ignorés si un `path` est fourni, ce qui n'est pas le cas pour `query`, comme le montre l'exemple ci-dessus. A la place, vous devez fournir le `name` de la route ou spécifier manuellement le `path` entier avec n'importe quel paramètre :

```js
const username = 'eduardo'
// nous pouvons construire manuellement l'url mais nous devrons gérer l'encodage nous-mêmes
router.push(`/user/${username}`) // -> /user/eduardo
// identique à
router.push({ path: `/user/${username}` }) // -> /user/eduardo
// si possible, utilisez `name` et `params` pour bénéficier de l'encodage automatique de l'URL
router.push({ name: 'user', params: { username } }) // -> /user/eduardo
// `params` ne peut pas être utilisé avec `path`.
router.push({ path: '/user', params: { username } }) // -> /user
```

Lorsque vous spécifiez `params`, assurez-vous de fournir une `string` ou un `number` (ou un tableau de ceux-ci pour les [repeatable-params](./route-matching-syntax.md#repeatable-params)). **Tout autre type (tel que `undefined`, `false`, etc.) sera automatiquement filtré**. Pour [optional params](./route-matching-syntax.md#repeatable-params), vous pouvez fournir une chaîne vide (`""`) comme valeur pour l'ignorer.

Since the prop `to` accepts the same kind of object as `router.push`, the exact same rules apply to both of them.

`router.push` and all the other navigation methods return a _Promise_ that allows us to wait til the navigation is finished and to know if it succeeded or failed. We will talk more about that in [Navigation Handling](../advanced/navigation-failures.md).

## Remplacer l'emplacement actuel

Il agit comme `router.push`, la seule différence est qu'il navigue sans pousser une nouvelle entrée d'historique, comme son nom le suggère - il remplace l'entrée actuelle.

| Declarative                       | Programme          |
| --------------------------------- | --------------------- |
| `<router-link :to="..." replace>` | `router.replace(...)` |

Il est également possible d'ajouter directement une propriété `replace : true` à la `routeLocation` qui est passée à `router.push` :

```js
router.push({ path: '/home', replace: true })
// équivalent à
router.replace({ path: '/home' })
```

## Traverser l'historique

Cette méthode prend en paramètre un entier unique qui indique de combien de pas il faut avancer ou reculer dans la pile de l'historique, de façon similaire à `window.history.go(n)`.

Exemples

```js
// avancer d'un enregistrement, comme router.forward()
router.go(1)

// recule d'un enregistrement, comme router.back()
router.go(-1)

// avancer de 3 enregistrements
router.go(3)

// échoue silencieusement s'il n'y a pas beaucoup d'enregistrements.
router.go(-100)
router.go(100)
```

## Manipulation de l'historique

Vous avez peut-être remarqué que `router.push`, `router.replace` et `router.go` sont des équivalents de [`window.history.pushState`, `window.history.replaceState` et `window.history.go`](https://developer.mozilla.org/en-US/docs/Web/API/History), et ils imitent les APIs `window.history`.

Par conséquent, si vous êtes déjà familiarisé avec [API de l'historique du navigateur](https://developer.mozilla.org/en-US/docs/Web/API/History_API), la manipulation de l'historique vous semblera familière lorsque vous utiliserez Vue Router.

Il convient de mentionner que les méthodes de navigation de Vue Router (`push`, `replace`, `go`) fonctionnent de manière cohérente quel que soit le type d'[option `history`](../../api/#history) passé lors de la création de l'instance du routeur.
