# Migration de Vue 2

La plupart de l'API de Vue Router est restée inchangée pendant sa réécriture de la v3 (pour Vue 2) à la v4 (pour Vue 3), mais il y a encore quelques changements de rupture que vous pourriez rencontrer lors de la migration de votre application. Ce guide est là pour vous aider à comprendre pourquoi ces changements ont eu lieu et comment adapter votre application pour qu'elle fonctionne avec Vue Router 4.

## Changements de rupture

Les changements sont ordonnés par leur utilisation. Il est donc recommandé de suivre cette liste dans l'ordre.

### new Router devient createRouter

Vue Router n'est plus une classe mais un ensemble de fonctions. Au lieu d'écrire `new Router()`, vous devez maintenant appeler `createRouter` :

```js
// précédemment était
// import Router from 'vue-router'
import { createRouter } from 'vue-router'

const router = createRouter({
  // ...
})
```

### Nouvelle option `history` en remplacement de `mode`.

L'option `mode : 'history'` a été remplacée par une option plus flexible nommée `history`. Selon le mode que vous utilisiez, vous devrez la remplacer par la fonction appropriée :

- `"history"`: `createWebHistory()`
- `"hash"`: `createWebHashHistory()`
- `"abstract"`: `createMemoryHistory()`

Voici un extrait complet :

```js
import { createRouter, createWebHistory } from 'vue-router'
// il y a aussi createWebHashHistory et createMemoryHistory

createRouter({
  history: createWebHistory(),
  routes: [],
})
```

Sur SSR, vous devez passer manuellement l'historique approprié :

```js
// router.js
let history = isServer ? createMemoryHistory() : createWebHistory()
let router = createRouter({ routes, history })
// quelque part dans votre server-entry.js
router.push(req.url) // request url
router.isReady().then(() => {
  // résoudre la demande
})
```

**Raison** : permettre de secouer l'arbre des historiques non utilisés ainsi que de mettre en œuvre des historiques personnalisés pour des cas d'utilisation avancés comme les solutions natives.

### Déplacement de l'option `base`.

L'option `base` est maintenant passée comme premier argument à `createWebHistory` (et aux autres histoires) :

```js
import { createRouter, createWebHistory } from 'vue-router'
createRouter({
  history: createWebHistory('/base-directory/'),
  routes: [],
})
```

### Suppression de l'option `fallback`.

L'option `fallback` n'est plus supportée lors de la création du routeur :

```diff
-new VueRouter({
+createRouter({
-  fallback: false,
// other options...
})
```

**Raison** : Tous les navigateurs supportés par Vue supportent la [HTML5 History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API), ce qui nous permet d'éviter les bidouillages autour de la modification de `location.hash` et d'utiliser directement `history.pushState()`.

### Suppression des routes `*` (star ou catch all)

Les routes "catch all" (`*`, `/*`) doivent maintenant être définies en utilisant un paramètre avec une regex personnalisée :

```js
const routes = [
  // pathMatch est le nom du paramètre, par exemple, aller vers /not/found donne des produits.
  // { params : { pathMatch : ['not', 'found'] }}
  // Ceci est dû au dernier *, qui signifie que les paramètres sont répétés.
  // vous prévoyez de naviguer directement vers la route non trouvée en utilisant son nom.
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  // si vous omettez le dernier `*`, le caractère l/` dans les paramètres sera encodé lors de la résolution ou de la poussée.
`/` character in params will be encoded when resolving or pushing
  { path: '/:pathMatch(.*)', name: 'bad-not-found', component: NotFound },
]
// mauvais exemple si on utilise des routes nommées :
router.resolve({
  name: 'bad-not-found',
  params: { pathMatch: 'not/found' },
}).href // '/not%2Ffound'
// bon exemple :
router.resolve({
  name: 'not-found',
  params: { pathMatch: ['not', 'found'] },
}).href // '/not/found'
```

:::tip
Vous n'avez pas besoin d'ajouter le `*` pour les paramètres répétés si vous ne prévoyez pas de pousser directement vers la route non trouvée en utilisant son nom. Si vous appelez `router.push('/not/found/url')`, il fournira le bon paramètre `pathMatch`.
:::

**Raison** : Vue Router n'utilise plus `path-to-regexp`, à la place il implémente son propre système d'analyse syntaxique qui permet de classer les routes et de permettre un routage dynamique. Puisque nous ajoutons généralement une seule route par projet, il n'y a pas de gros avantage à supporter une syntaxe spéciale pour `*`. L'encodage des paramètres est encodé à travers les routes, sans exception pour rendre les choses plus faciles à prévoir.

### Remplacement de la fonction `onReady` par `isReady`.

La fonction existante `router.onReady()` a été remplacée par `router.isReady()` qui ne prend aucun argument et retourne une Promise :

```js
// remplace
router.onReady(onSuccess, onError)
// avec
router.isReady().then(onSuccess).catch(onError)
// ou utiliser await :
try {
  await router.isReady()
  // onSuccess
} catch (err) {
  // onError
}
```

### Modifications de `scrollBehavior`.

L'objet retourné par `scrollBehavior` est maintenant similaire à [`ScrollToOptions`](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions) : `x` est renommé en `left` et `y` est renommé en `top`. Voir [RFC](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0035-router-scroll-position.md).

**Raison** : rendre l'objet similaire à `ScrollToOptions` pour le rendre plus familier avec les API natives de JS et potentiellement permettre de nouvelles options futures.

### `<router-view>`, `<keep-alive>`, et `<transition>`

`transition` et `keep-alive` doivent maintenant être utilisés **à l'intérieur** de `RouterView` via l'API `v-slot` :

```vue
<router-view v-slot="{ Component }">
  <transition>
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </transition>
</router-view>
```

**Raison** : Cette modification était nécessaire. Voir le [RFC lié](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0034-router-view-keep-alive-transitions.md).

### Suppression de la propriété `append` dans `<router-link>`.

La prop `append` a été supprimée de `<router-link>`. Vous pouvez concaténer manuellement la valeur à un `path` existant à la place :

```html
replace
<router-link to="child-route" append>to relative child</router-link>
with
<router-link :to="append($route.path, 'child-route')">
  to relative child
</router-link>
```

Vous devez définir une fonction `append` globale sur votre instance _App_ :

```js
app.config.globalProperties.append = (path, pathToAppend) =>
  path + (path.endsWith('/') ? '' : '/') + pathToAppend
```

**Reason** : `append` n'était pas utilisé très souvent, est facile à répliquer dans le pays de l'utilisateur.

### Suppression des props `event` et `tag` dans `<router-link>`

Les props `event` et `tag` ont été supprimés de `<router-link>`. Vous pouvez utiliser l'API [`v-slot`](../../api/#router-link-s-v-slot) pour personnaliser entièrement `<router-link>` :

```html
replace
<router-link to="/about" tag="span" event="dblclick">About Us</router-link>
with
<router-link to="/about" custom v-slot="{ navigate }">
  <span @click="navigate" @keypress.enter="navigate" role="link">About Us</span>
</router-link>
```

**Raison** : Ces props étaient souvent utilisés ensemble pour utiliser quelque chose de différent d'une balise `<a>` mais ont été introduits avant l'API `v-slot` et ne sont pas assez utilisés pour justifier l'ajout de la taille du paquet pour tout le monde.

### Suppression du prop `exact` dans `<router-link>`.

L'option `exact` a été supprimée parce que le caveat qu'elle corrigeait n'est plus présent, vous devriez donc pouvoir la supprimer en toute sécurité. Il y a cependant deux choses dont vous devez être conscient :

- Les itinéraires sont maintenant actifs en fonction des enregistrements d'itinéraires qu'ils représentent au lieu des objets d'emplacement d'itinéraire générés et de leurs propriétés `path`, `query`, et `hash`.
- Seule la section `path` est comparée, `query` et `hash` ne sont plus pris en compte.

Si vous souhaitez personnaliser ce comportement, par exemple en prenant en compte la section `hash`, vous devez utiliser l'API [`v-slot`](https://next.router.vuejs.org/api/#router-link-s-v-slot) pour étendre `<router-link>`.

**Raison** : Voir les modifications du [RFC sur la correspondance active](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0028-router-active-link.md#summary) pour plus de détails.

### Les gardes de navigation dans les mixins sont ignorées

Pour le moment, les gardes de navigation dans les mixins ne sont pas prises en charge. Vous pouvez suivre son support à [vue-router#454](https://github.com/vuejs/vue-router-next/issues/454).

### Suppression de `router.match` et modifications de `router.resolve`.

`router.match`, et `router.resolve` ont été fusionnés en `router.resolve` avec une signature légèrement différente. [Consultez l'API](../../api/#resolve) pour plus de détails.

**Raison** : Unification de plusieurs méthodes qui étaient utilisées dans le même but.

### Suppression de la méthode `router.getMatchedComponents()`.

La méthode `router.getMatchedComponents` est maintenant supprimée car les composants appariés peuvent être récupérés à partir de `router.currentRoute.value.matched` :

```js
router.currentRoute.value.matched.flatMap(record =>
  Object.values(record.components)
)
```

**Raison** : Cette méthode n'a été utilisée qu'au cours du SSR et peut être réalisée par l'utilisateur.

### **Toutes** les navigations sont maintenant toujours asynchrones

Toutes les navigations, y compris la première, sont maintenant asynchrones, ce qui signifie que, si vous utilisez une `transition`, vous devrez peut-être attendre que le routeur soit _prêt_ avant de monter l'application :

```js
app.use(router)
// Note : du côté du serveur, vous devez pousser manuellement l'emplacement initial.
router.isReady().then(() => app.mount('#app'))
```

Sinon, il y aura une transition initiale comme si vous aviez fourni la prop `appear` à `transition` parce que le routeur affiche son emplacement initial (rien) et ensuite affiche le premier emplacement.

Notez que **si vous avez des gardes de navigation lors de la navigation initiale**, vous ne voudrez peut-être pas bloquer le rendu de l'application jusqu'à ce qu'ils soient résolus, à moins que vous ne fassiez un rendu côté serveur. Dans ce scénario, ne pas attendre que le routeur soit prêt pour monter l'application donnerait le même résultat que dans Vue 2.

### Suppression de `router.app`

`router.app` représentait le dernier composant racine (instance Vue) qui injectait le routeur. Vue Router peut maintenant être utilisé en toute sécurité par plusieurs applications Vue en même temps. Vous pouvez toujours l'ajouter lors de l'utilisation du routeur :

```js
app.use(router)
router.app = app
```

Vous pouvez également étendre la définition TypeScript de l'interface `Router` pour ajouter la propriété `app`.

**Raison** : Les applications Vue 3 n'existent pas dans Vue 2 et maintenant nous supportons correctement plusieurs applications utilisant la même instance Router, donc avoir une propriété `app` aurait été trompeur parce que cela aurait été l'application au lieu de l'instance racine.

### Passer du contenu aux `<slot>` des composants de route

Auparavant, vous pouviez passer directement un modèle à rendre par un composant de route `<slot>` en l'imbriquant sous un composant `<router-view>` :

```html
<router-view>
  <p>In Vue Router 3, I render inside the route component</p>
</router-view>
```

En raison de l'introduction de l'API `v-slot` pour `<router-view>`, vous devez le passer au `<component>` en utilisant l'API `v-slot` :

```html
<router-view v-slot="{ Component }">
  <component :is="Component">
    <p>In Vue Router 3, I render inside the route component</p>
  </component>
</router-view>
```

### Suppression de la propriété `parent` des emplacements de route

La propriété `parent` a été supprimée des emplacements de route normalisés (`this.$route` et objet retourné par `router.resolve`). Vous pouvez toujours y accéder via le tableau `matched` :

```js
const parent = this.$route.matched[this.$route.matched.length - 2]
```

**Raison** : Avoir `parent` et `children` crée des références circulaires inutiles alors que les propriétés pourraient déjà être récupérées par `matched`.

### Suppression de `pathToRegexpOptions`.

Les propriétés `pathToRegexpOptions` et `caseSensitive` des enregistrements de route ont été remplacées par les options `sensitive` et `strict` pour `createRouter()`. Elles peuvent maintenant aussi être passées directement lors de la création du routeur avec `createRouter()`. Toute autre option spécifique à `path-to-regexp` a été supprimée car `path-to-regexp` n'est plus utilisé pour analyser les chemins.

### Suppression des paramètres non nommés

En raison de la suppression de `path-to-regexp`, les paramètres non nommés ne sont plus supportés :

- `/foo(/foo)?/suffix` devient `/foo/:_(foo)?/suffix`
- `/foo(foo)?` devient `/foo:_(foo)?`
- `/foo/(.*)` devient `/foo/:_(.*)`

:::tip
Notez que vous pouvez utiliser n'importe quel nom à la place de `_` pour le paramètre. Le but est d'en fournir un.
:::

### Usage de `history.state`

Vue Router enregistre les informations sur le fichier `history.state`. Si vous avez du code qui appelle manuellement `history.pushState()`, vous devriez probablement l'éviter ou le remanier avec un `router.push()` normal et un `history.replaceState()` :

```js
// remplacer
history.pushState(myState, '', url)
// avec
await router.push(url)
history.replaceState({ ...history.state, ...myState }, '')
```

De même, si vous appelez `history.replaceState()` sans préserver l'état actuel, vous devrez passer le `history.state` actuel :

```js
// replace
history.replaceState({}, '', url)
// with
history.replaceState(history.state, '', url)
```

**Raison** : Nous utilisons l'état de l'historique pour enregistrer des informations sur la navigation, comme la position de défilement, l'emplacement précédent, etc.

### L'option `routes` est requise dans `options`

La propriété `routes` est maintenant obligatoire dans `options`.

```js
createRouter({ routes: [] })
```

**Raison** : Le routeur est conçu pour être créé avec des routes même si vous pouvez en ajouter par la suite. Vous avez besoin d'au moins une route dans la plupart des scénarios et elle est écrite une fois par application en général.

### Routes nommées inexistantes

Pousser ou résoudre une route nommée inexistante provoque une erreur :

```js
// Oups, on a fait une faute de frappe dans le nom
router.push({ name: 'homee' }) // throws
router.resolve({ name: 'homee' }) // throws
```

**Raison** : Auparavant, le routeur naviguait vers `/` mais n'affichait rien (au lieu de la page d'accueil). Lancer une erreur est plus logique car nous ne pouvons pas produire une URL valide vers laquelle naviguer.

### Manque de paramètres requis sur les routes nommées

L'envoi ou la résolution d'une route nommée sans les paramètres requis entraînera une erreur :

```js
// étant donné la route suivante :
const routes = [{ path: '/users/:id', name: 'user', component: UserDetails }]

// L'absence du paramètre `id` entraînera un échec.
router.push({ name: 'user' })
router.resolve({ name: 'user' })
```

**Raison** : Même chose que ci-dessus.

### Les routes enfant nommées avec un `path` vide n'ajoutent plus de slash.

Étant donné toute route nommée imbriquée avec un `path` vide :

```js
const routes = [
  {
    path: '/dashboard',
    name: 'dashboard-parent',
    component: DashboardParent,
    children: [
      { path: '', name: 'dashboard', component: DashboardDefault },
      {
        path: 'settings',
        name: 'dashboard-settings',
        component: DashboardSettings,
      },
    ],
  },
]
```

La navigation ou la résolution de la route nommée `dashboard` produira maintenant une URL **sans slash de fin** :

```js
router.resolve({ name: 'dashboard' }).href // '/dashboard'
```

Cela a un effet secondaire important sur les enregistrements `redirect` des enfants comme ceux-ci :

```js
const routes = [
  {
    path: '/parent',
    component: Parent,
    children: [
      // cela redirigerait maintenant vers `/home` au lieu de `/parent/home`.
      { path: '', redirect: 'home' },
      { path: 'home', component: Home },
    ],
  },
]
```

Notez que cela fonctionnera si `path` était `/parent/` car la position relative `home` par rapport à `/parent/` est bien `/parent/home` mais la position relative de `home` par rapport à `/parent` est `/home`.

<!-- Learn more about relative links [in the cookbook](../../cookbook/relative-links.md). -->

**Raison** : Ceci est pour rendre cohérent le comportement des slashs de fin de ligne : par défaut, toutes les routes autorisent un slash de fin de ligne. Il peut être désactivé en utilisant l'option `strict` et en ajoutant manuellement (ou non) un slash aux routes.

<!-- TODO: maybe a cookbook entry -->

### `$route` properties Encoding

Les valeurs décodées dans `params`, `query` et `hash` sont maintenant cohérentes, quel que soit l'endroit où la navigation est initiée (les anciens navigateurs produiront toujours des `path` et `fullPath` non codés). La navigation initiale devrait donner les mêmes résultats que les navigations in-app.

Étant donné n'importe quel [emplacement de route normalisé](../../api/#routelocationnormalized) :

- Les valeurs dans `path`, `fullPath` ne sont plus décodées. Elles apparaîtront telles que fournies par le navigateur (la plupart des navigateurs les fournissent encodées). Par exemple, écrire directement sur la barre d'adresse `https://example.com/hello world` donnera la version encodée : `https://example.com/hello%20world` et `path` et `fullPath` seront tous deux `/hello%20world`.
- `hash` est maintenant décodé, de cette façon il peut être copié : `router.push({hash : $route.hash })` et être utilisé directement dans l'option `el` de [scrollBehavior](../../api/#scrollbehavior).
- Lorsque vous utilisez `push`, `resolve`, et `replace` et que vous fournissez un emplacement `string` ou une propriété `path` dans un objet, **il doit être encodé** (comme dans la version précédente). D'autre part, `params`, `query` et `hash` doivent être fournis dans leur version non encodée.
- Le caractère slash (`/`) est maintenant correctement décodé dans `params` tout en produisant une version encodée sur l'URL : `%2F`.

**Raison** : Cela permet de copier facilement les propriétés existantes d'un emplacement lors de l'appel de `router.push()` et `router.resolve()`, et de rendre l'emplacement de la route résultant cohérent à travers les navigateurs. `router.push()` est maintenant idempotent, ce qui signifie que l'appel à `router.push(route.fullPath)`, `router.push({ hash : route.hash })`, `router.push({ query : route.query })`, et `router.push({ params : route.params })` ne créera pas d'encodage supplémentaire.

### Modifications TypeScript

Pour rendre les typages plus cohérents et expressifs, certains types ont été renommés :

| `vue-router@3` | `vue-router@4`          |
| -------------- | ----------------------- |
| RouteConfig    | RouteRecordRaw          |
| Location       | RouteLocation           |
| Route          | RouteLocationNormalized |

## Nouvelles fonctionnalités

Voici quelques-unes des nouvelles fonctionnalités à surveiller dans Vue Router 4 :

- [Routage dynamique](../advanced/dynamic-routing.md)
- [Composition API](../advanced/composition-api.md)
<!-- - Custom History implementation -->
