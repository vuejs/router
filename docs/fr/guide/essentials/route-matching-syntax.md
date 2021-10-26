# Syntaxe de correspondance des routes

La plupart des applications utilisent des routes statiques comme `/about` et des routes dynamiques comme `/users/:userId` comme nous venons de le voir dans [Dynamic Route Matching](./dynamic-matching.md), mais Vue Router a beaucoup plus à offrir !

:::tip
Pour des raisons de simplicité, tous les enregistrements d'itinéraire **sont dépourvus de la propriété `component`** pour se concentrer sur la valeur `path`.
:::

## Regexp personnalisée dans les paramètres

Lors de la définition d'un paramètre comme `:userId`, nous utilisons en interne la regexp suivante `([^/]+)` (au moins un caractère qui n'est pas un slash `/`) pour extraire les paramètres des URLs. Cela fonctionne bien, sauf si vous devez différencier deux routes en fonction du contenu du paramètre. Imaginez deux routes `/:orderId` et `/:productName`, les deux correspondraient exactement aux mêmes URLs, donc nous avons besoin d'un moyen de les différencier. Le moyen le plus simple serait d'ajouter une section statique au chemin qui les différencie :

```js
const routes = [
  // correspond à /o/3549
  { path: '/o/:orderId' },
  // correspond à /p/books
  { path: '/p/:productName' },
]
```

Mais dans certains scénarios, nous ne voulons pas ajouter cette section statique `/o`/`p`. Cependant, `orderId` est toujours un nombre alors que `productName` peut être n'importe quoi, donc nous pouvons spécifier une regexp personnalisée pour un paramètre entre parenthèses :

```js
const routes = [
  // /:orderId -> ne correspond qu'à des nombres
  { path: '/:orderId(\\d+)' },
  // /:productName -> correspond à toute autre chose
  { path: '/:productName' },
]
```

Maintenant, aller à `/25` correspondra à `/:orderId` tandis qu'aller à tout autre endroit correspondra à `/:productName`. L'ordre du tableau `routes` n'a même pas d'importance !

:::tip
Veillez à **échapper les barres obliques inverses (`\`)** comme nous l'avons fait avec `\d` (qui devient `\\d`) pour passer réellement le caractère oblique inversé dans une chaîne en JavaScript.
:::

## Paramètres répétables

Si vous devez faire correspondre des routes avec plusieurs sections comme `/first/second/third`, vous devez marquer un paramètre comme répétable avec `*` (0 ou plus) et `+` (1 ou plus) :

```js
const routes = [
  // /:chapitres -> correspond à /one, /one/two, /one/two/three, etc.
  { path: '/:chapters+' },
  // /:chapitres -> correspond à /, /one, /one/two, /one/two/three, etc.
  { path: '/:chapters*' },
]
```

Cela vous donnera un tableau de paramètres au lieu d'une chaîne et vous obligera également à passer un tableau lorsque vous utilisez des routes nommées :

```js
// donné { path : '/:chapters*', name : 'chapters' },
router.resolve({ name: 'chapters', params: { chapters: [] } }).href
// produit /
router.resolve({ name: 'chapters', params: { chapters: ['a', 'b'] } }).href
// produit /a/b

// donné { path: '/:chapters+', name: 'chapters' },
router.resolve({ name: 'chapters', params: { chapters: [] } }).href
// lance une erreur parce que `chapters` est vide
```

Elles peuvent également être combinées avec des Regexp personnalisées en les ajoutant **après les parenthèses fermantes** :

```js
const routes = [
  // ne correspond qu'aux numéros
  //  correspond à /1, /1/2, etc.
  { path: '/:chapters(\\d+)+' },
  // correspond à /, /1, /1/2, etc
  { path: '/:chapters(\\d+)*' },
]
```

## Paramètres optionnels

Vous pouvez également marquer un paramètre comme facultatif en utilisant le modificateur `?` (0 ou 1) :

```js
const routes = [
  // correspondra à /users et /users/posva
  { path: '/users/:userId?' },
  // correspondra à /users et /users/42
  { path: '/users/:userId(\\d+)?' },
]
```

Notez que `*` marque techniquement aussi un paramètre comme optionnel mais les paramètres `?` ne peuvent pas être répétés.

## Débogage

Si vous avez besoin de voir comment vos routes sont transformées en Regexp pour comprendre pourquoi une route ne correspond pas ou, pour rapporter un bug, vous pouvez utiliser le [outil de classement des chemins](https://paths.esm.dev/?p=AAMeJSyAwR4UbFDAFxAcAGAIJXMAAA..#). Il prend en charge le partage de vos routes via l'URL.
