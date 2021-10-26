---
sidebar: auto
---

# API Reference

## `<router-link>` Props

### to

- **Type**: [`RouteLocationRaw`](#routelocationraw)
- **Détails**:

  Indique la route cible du lien. Lorsque l'on clique sur le lien, la valeur de l'élément `to` sera transmise à `router.push()` en interne. Il peut donc s'agir d'une `string` ou d'un [objet de localisation de route](#routelocationraw).

```html
<!-- chaîne littérale -->
<router-link to="/home">Home</router-link>
<!-- se transforme en -->
<a href="/home">Home</a>

<!-- expression javascript utilisant `v-bind` -->
<router-link :to="'/home'">Home</router-link>

<!-- même chose que ci-dessus -->
<router-link :to="{ path: '/home' }">Home</router-link>

<!-- route nommée -->
<router-link :to="{ name: 'user', params: { userId: '123' }}">User</router-link>

<!-- avec une requête, résultant en `/register?plan=private` -->
<router-link :to="{ path: '/register', query: { plan: 'private' }}">
  Register
</router-link>
```

### replace

- **Type**: `boolean`
- **Défaut**: `false`
- **Détails**:

  Si vous définissez la prop `replace`, vous appellerez `router.replace()` au lieu de `router.push()` lorsque vous cliquerez, de sorte que la navigation ne laissera pas d'enregistrement dans l'historique.

```html
<router-link to="/abc" replace></router-link>
```

### active-class

- **Type**: `string`
- **Défaut**: `"router-link-active"` (or global [`linkActiveClass`](#linkactiveclass))
- **Détails**:

  Classe à appliquer sur le `<a>` rendu lorsque le lien est actif.

### aria-current-value

- **Type**: `'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'` (`string`)
- **Défault**: `"page"`
- **Détails**:

  Valeur transmise à l'attribut `aria-current` lorsque le lien est exactement actif.

### custom

- **Type**: `boolean`
- **Défaut**: `false`
- **Détails**:

  Si `<router-link>` ne doit pas envelopper son contenu dans un élément `<a>`. Utile lorsque vous utilisez [`v-slot`](#router-link-s-v-slot) pour créer un RouterLink personnalisé. Par défaut, `<router-link>` rendra son contenu enveloppé dans un élément `<a>`, même en utilisant `v-slot`. En passant la prop `custom`, vous supprimez ce comportement.


- **Exemples**:

  ```html
  <router-link to="/home" custom v-slot="{ navigate, href, route }">
    <a :href="href" @click="navigate">{{ route.fullPath }}</a>
  </router-link>
  ```

  Rendu `<a href="/home">/home</a>`.

  ```html
  <router-link to="/home" v-slot="{ route }">
    <span>{{ route.fullPath }}</span>
  </router-link>
  ```

  Rendu `<a href="/home"><span>/home</span></a>`.

### exact-active-class

- **Type**: `string`
- **Défaut**: `"router-link-exact-active"` (or global [`linkExactActiveClass`](#linkexactactiveclass))
- **Détails**:

  Classe à appliquer sur le `<a>` rendu lorsque le lien est actif exact.

## `<router-link>`'s `v-slot`

`<router-link>` expose une personnalisation de bas niveau via un [scoped slot](https://v3.vuejs.org/guide/component-slots.html#scoped-slots). Il s'agit d'une API plus avancée qui s'adresse principalement aux auteurs de bibliothèques, mais qui peut également s'avérer utile pour les développeurs, afin de construire un composant personnalisé comme un _NavLink_ ou autre.

:::tip
N'oubliez pas de passer l'option `custom` à `<router-link>` pour l'empêcher de placer son contenu à l'intérieur d'un élément `<a>`.
:::

```html
<router-link
  to="/about"
  custom
  v-slot="{ href, route, navigate, isActive, isExactActive }"
>
  <NavLink :active="isActive" :href="href" @click="navigate">
    {{ route.fullPath }}
  </NavLink>
</router-link>
```

- `href` : url résolu. Il s'agit de l'attribut `href` d'un élément `<a>`. Il contient la `base` s'il a été fourni.
- `route` : emplacement normalisé résolu.
- `navigate` : fonction pour déclencher la navigation. **Il empêchera automatiquement les événements si nécessaire**, de la même manière que `router-link` le fait, par exemple `ctrl` ou `cmd` + click seront toujours ignorés par `navigate`.
- `isActive` : `true` si la [classe active](#active-class) doit être appliquée. Permet d'appliquer une classe arbitraire.
- `isExactActive` : `true` si la [classe active exacte](#exact-active-class) doit être appliquée. Permet d'appliquer une classe arbitraire.

### Exemple : Appliquer la classe active à un élément extérieur

Parfois, on peut vouloir appliquer la classe active à un élément extérieur plutôt qu'à l'élément `<a>` lui-même. Dans ce cas, vous pouvez envelopper cet élément dans un `router-link` et utiliser les propriétés `v-slot` pour créer votre lien :

```html
<router-link
  to="/foo"
  custom
  v-slot="{ href, route, navigate, isActive, isExactActive }"
>
  <li
    :class="[isActive && 'router-link-active', isExactActive && 'router-link-exact-active']"
  >
    <a :href="href" @click="navigate">{{ route.fullPath }}</a>
  </li>
</router-link>
```

:::tip
Si vous ajoutez un `target="_blank"` à votre élément `a`, vous devez omettre le gestionnaire `@click="navigate"`.
:::

## `<router-view>` Props

### name

- **Type**: `string`
- **Défaut**: `"default"`
- **Détails**:

  Lorsqu'une `<router-view>` a un `name`, elle rendra le composant avec le nom correspondant dans l'option `components` de l'enregistrement de route correspondant.

- **Voir aussi**: [Named Views](../guide/essentials/named-views.md)

### route

- **Type**: [`RouteLocationNormalized`](#routelocationnormalized)
- **Détails**:

  Un emplacement d'itinéraire dont tous les composants ont été résolus (s'ils ont été chargés paresseusement) afin qu'il puisse être affiché.

## `<router-view>`'s `v-slot`

`<router-view>` expose une API `v-slot` principalement pour envelopper vos composants de route avec des composants `<transition>` et `<keep-alive>`.

```html
<router-view v-slot="{ Component, route }">
  <transition :name="route.meta.transition || 'fade'" mode="out-in">
    <keep-alive>
      <suspense>
        <template #default>
          <component
            :is="Component"
            :key="route.meta.usePathKey ? route.path : undefined"
          />
        </template>
        <template #fallback> Loading... </template>
      </suspense>
    </keep-alive>
  </transition>
</router-view>
```

- `Component` : VNodes à passer à la prop `<component>` `is`.
- `route` : [emplacement de la route](#routelocationnormalized) normalisé résol.
- `Component`: VNodes to be passed to a `<component>`'s `is` prop.

## createRouter

Crée une instance de routeur qui peut être utilisée par une application Vue. Vérifiez le [`RouterOptions`](#routeroptions) pour une liste de toutes les propriétés qui peuvent être passées.

**Signature:**

```typescript
export declare function createRouter(options: RouterOptions): Router
```

### Paramètres

| Parameter | Type                            | Description                      |
| --------- | ------------------------------- | -------------------------------- |
| options   | [RouterOptions](#routeroptions) | Options to initialize the router |

## createWebHistory

Crée un historique HTML5. L'historique le plus courant pour les applications à page unique. L'application doit être servie par le protocole http.

**Signature:**

```typescript
export declare function createWebHistory(base?: string): RouterHistory
```

### Paramètres

| Parameter | Type     | Description                                                                                                           |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| base      | `string` | base facultative à fournir. Utile lorsque l'application est hébergée dans un dossier comme `https://example.com/folder/`. |

### Exemples

```js
createWebHistory() // No base, the app is hosted at the root of the domain `https://example.com`
createWebHistory('/folder/') // donne une url de `https://example.com/folder/`
```

## createWebHashHistory

Crée un historique de hachage. Utile pour les applications web sans hôte (par exemple `file://`) ou lorsque la configuration d'un serveur pour gérer n'importe quelle URL n'est pas une option. **Notez que vous devriez utiliser [`createWebHistory`](#createwebhistory) si le référencement est important pour vous**.

**Signature:**

```typescript
export declare function createWebHashHistory(base?: string): RouterHistory
```

### Parameètres

| Parameter | Type     | Description                                                                                                                                                                                                                                                                                                                                                       |
| --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| base      | `string` | base optionnelle à fournir. La valeur par défaut est `location.pathname + location.search`. S'il y a une balise `<base>` dans le `head`, sa valeur sera ignorée au profit de ce paramètre **mais notez que cela affecte tous les appels history.pushState()**, ce qui signifie que si vous utilisez une balise `<base>`, sa valeur `href` **doit correspondre à ce paramètre** (en ignorant tout ce qui se trouve après le `#`). |

### Exemples

```js
// at https://example.com/folder
createWebHashHistory() // donne une url de `https://example.com/folder#`
createWebHashHistory('/folder/') // donne une url de `https://example.com/folder/#`
// si le `#` est fourni dans la base, il ne sera pas ajouté par `createWebHashHistory`.
createWebHashHistory('/folder/#/app/') // donne une url de `https://example.com/folder/#/app/`
// il faut éviter de faire cela car cela change l'url d'origine et empêche la copie d'urls.
createWebHashHistory('/other-folder/') // donne une url de `https://example.com/other-folder/#`

// at file:///usr/etc/folder/index.html
// pour les emplacements sans `host`, la base est ignorée.
createWebHashHistory('/iAmIgnored') // donne une url de `file:///usr/etc/folder/index.html#`
```

## createMemoryHistory

Crée un historique basé sur la mémoire. Le but principal de cet historique est de gérer les SSR. Il commence dans un emplacement spécial qui n'est nulle part. Si l'utilisateur n'est pas sur un contexte de navigateur, c'est à lui de remplacer cet emplacement par l'emplacement de départ en appelant soit `router.push()` soit `router.replace()`.

**Signature:**

```typescript
export declare function createMemoryHistory(base?: string): RouterHistory
```

### Parameters

| Parameter | Type     | Description                               |
| --------- | -------- | ----------------------------------------- |
| base      | `string` | Base appliquée à toutes les urls, la valeur par défaut est '/'. |

### Retours

Un objet historique qui peut être passé au constructeur du routeur.

## NavigationFailureType

Enumération de tous les types possibles d'échecs de navigation. Peut être passée à [isNavigationFailure](#isnavigationfailure) pour vérifier des échecs spécifiques. **N'utilisez jamais aucune des valeurs numériques**, utilisez toujours les variables comme `NavigationFailureType.aborted`.

**Signature:**

```typescript
export declare enum NavigationFailureType
```

### Membres

| Member     | Value | Description                                                                                                                      |
| ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| aborted    | 4     | Une navigation interrompue est une navigation qui a échoué parce qu'un garde de navigation a renvoyé `false` ou a appelé `next(false)`.            |
| cancelled  | 8     | Une navigation annulée est une navigation qui a échoué parce qu'une navigation plus récente a été commencée (pas nécessairement terminée).. |
| duplicated | 16    | Une navigation dupliquée est une navigation qui a échoué parce qu'elle a été lancée alors qu'elle se trouvait déjà au même endroit.     |

## START_LOCATION

- **Type**: [`RouteLocationNormalized`](#routelocationnormalized)
- **Détails**:

  Emplacement de la route initiale où se trouve le routeur. Peut être utilisé dans les gardes de navigation pour différencier la navigation initiale.

  ```js
  import { START_LOCATION } from 'vue-router'

  router.beforeEach((to, from) => {
    if (from === START_LOCATION) {
      // navigation initiale
    }
  })
  ```

## Composition API

### onBeforeRouteLeave

Ajoute un garde de navigation qui se déclenche lorsque le composant de l'emplacement actuel est sur le point d'être quitté. Similaire à `beforeRouteLeave` mais peut être utilisé dans n'importe quel composant. La protection est supprimée lorsque le composant est démonté.

**Signature:**

```typescript
export declare function onBeforeRouteLeave(leaveGuard: NavigationGuard): void
```

#### Paramètres

| Parameter  | Type                                  | Description             |
| ---------- | ------------------------------------- | ----------------------- |
| leaveGuard | [`NavigationGuard`](#navigationguard) | Garde de navigation à ajouter |

### onBeforeRouteUpdate

Ajoutez une garde de navigation qui se déclenche chaque fois que l'emplacement actuel est sur le point d'être mis à jour. Similaire à `beforeRouteUpdate` mais peut être utilisé dans n'importe quel composant. Le garde est supprimé lorsque le composant est démonté.

**Signature:**

```typescript
export declare function onBeforeRouteUpdate(updateGuard: NavigationGuard): void
```

#### Parameters

| Parameter   | Type                                  | Description             |
| ----------- | ------------------------------------- | ----------------------- |
| updateGuard | [`NavigationGuard`](#navigationguard) | Garde de navigation à ajoute |

### useLink

Renvoie tout ce qui est exposé par l'API [`v-slot`](#router-link-s-v-slot).

**Signature:**

```typescript
export declare function useLink(props: RouterLinkOptions): {
  route: ComputedRef<RouteLocationNormalized & { href: string }>,
  href: ComputedRef<string>,
  isActive: ComputedRef<boolean>,
  isExactActive: ComputedRef<boolean>,
  navigate: (event?: MouseEvent) => Promise(NavigationFailure | void),
}
```

#### Paramètres

| Parameter | Type                | Description                                                                           |
| --------- | ------------------- | ------------------------------------------------------------------------------------- |
| props     | `RouterLinkOptions` | Objet props qui peut être passé à `<router-link>`. Accepte les `Ref`s et `ComputedRef`s |

### useRoute

Renvoie l'emplacement actuel de la route. Equivalent à l'utilisation de `$route` dans les modèles. Doit être appelé à l'intérieur de `setup()`.

**Signature:**

```typescript
export declare function useRoute(): RouteLocationNormalized
```

### useRouter

Renvoie l'instance [router](#router-properties). Equivalent à l'utilisation de `$router` dans les modèles. Doit être appelé à l'intérieur de `setup()`.

**Signature:**

```typescript
export declare function useRouter(): Router
```

## TypeScript

Voici quelques-unes des interfaces et des types utilisés par Vue Router. La documentation les référencent pour vous donner une idée des propriétés existantes dans les objets.

## Propriétés de Router

### currentRoute

- **Type**: [`Ref<RouteLocationNormalized>`](#routelocationnormalized)
- **Détails**:

  Emplacement actuel de l'itinéraire. En lecture seule.

### options

- **Type**: [`RouterOptions`](#routeroptions)
- **Détails**:

  Objet d'options original passé pour créer le routeur. En lecture seule.

## Les méthodes de Router

### addRoute

Ajoute un nouveau [Route Record] (#routerecordraw) comme enfant d'une route existante. Si la route a un `name` et qu'il y a déjà une route existante avec le même nom, il la supprime en premier.

**Signature:**

```typescript
addRoute(parentName: string | symbol, route: RouteRecordRaw): () => void
```

_Parameters_

| Parameter  | Type                                | Description                                             |
| ---------- | ----------------------------------- | ------------------------------------------------------- |
| parentName | `string \| symbol`                  | Enregistrement de route parent où `route` doit être ajouté à |
| route      | [`RouteRecordRaw`](#routerecordraw) | Enregistrement de l'itinéraire à ajouter                                     |

### addRoute

Ajoute une nouvelle [route record] (#routerecordraw) au routeur. Si la route a un `name` et qu'il y a déjà une route existante avec le même nom, il la supprime en premier.

**Signature:**

```typescript
addRoute(route: RouteRecordRaw): () => void
```

_Parameters_

| Parameter | Type                                | Description         |
| --------- | ----------------------------------- | ------------------- |
| route     | [`RouteRecordRaw`](#routerecordraw) | Enregistrement de l'itinéraire à ajouter |

:::tip
Notez que l'ajout d'itinéraires ne déclenche pas une nouvelle navigation, ce qui signifie que l'itinéraire ajouté ne sera pas affiché à moins qu'une nouvelle navigation ne soit déclenchée.
:::

### afterEach

Ajoute un crochet de navigation qui est exécuté après chaque navigation. Renvoie une fonction qui supprime le crochet enregistré.

**Signature:**

```typescript
afterEach(guard: NavigationHookAfter): () => void
```

_Parameters_

| Parameter | Type                  | Description            |
| --------- | --------------------- | ---------------------- |
| guard     | `NavigationHookAfter` | crochet de navigation à ajouter |

#### Exemples

```js
router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('failed navigation', failure)
  }
})
```

### back

Revenir en arrière dans l'historique si possible en appelant `history.back()`. Equivalent à `router.go(-1)`.
**Signature:**

```typescript
back(): void
```

### beforeEach

Ajoute une garde de navigation qui s'exécute avant toute navigation. Renvoie une fonction qui supprime la garde enregistrée.

**Signature:**

```typescript
beforeEach(guard: NavigationGuard): () => void
```

_Parameters_

| Parameter | Type                                  | Description             |
| --------- | ------------------------------------- | ----------------------- |
| guard     | [`NavigationGuard`](#navigationguard) | garde de navigation à ajouter |

### beforeResolve

Ajouter une garde de navigation qui s'exécute avant que la navigation soit sur le point d'être résolue. À ce stade, tous les composants ont été récupérés et les autres gardes de navigation ont réussi. Renvoie une fonction qui supprime la garde enregistrée.

**Signature:**

```typescript
beforeResolve(guard: NavigationGuard): () => void
```

_Parameters_

| Parameter | Type                                  | Description             |
| --------- | ------------------------------------- | ----------------------- |
| guard     | [`NavigationGuard`](#navigationguard) | garde de navigation à ajouter |

#### Exemples

```js
router.beforeResolve(to => {
  if (to.meta.requiresAuth && !isAuthenticated) return false
})
```

### forward

Avancez dans l'historique si possible en appelant `history.forward()`. Equivalent à `router.go(1)`.

**Signature:**

```typescript
forward(): void
```

### getRoutes

Obtenez une liste complète de tous les [enregistrements d'itinéraire] (#routerecord).

**Signature:**

```typescript
getRoutes(): RouteRecord[]
```

### go

Permet d'avancer ou de reculer dans l'historique.

**Signature:**

```typescript
go(delta: number): void
```

_Parameters_

| Parameter | Type     | Description                                                                         |
| --------- | -------- | ----------------------------------------------------------------------------------- |
| delta     | `number` | La position dans l'historique à laquelle vous voulez vous déplacer, par rapport à la page actuelle. |

### hasRoute

Vérifie si une route avec un nom donné existe.

**Signature:**

```typescript
hasRoute(name: string | symbol): boolean
```

_Parameters_

| Parameter | Type               | Description                |
| --------- | ------------------ | -------------------------- |
| name      | `string \| symbol` | Nom de la route à vérifier |

### isReady

Renvoie une Promise qui se résout lorsque le routeur a terminé la navigation initiale, ce qui signifie qu'il a résolu tous les crochets d'entrée asynchrones et les composants asynchrones qui sont associés à la route initiale. Si la navigation initiale a déjà eu lieu, la promesse est résolue immédiatement, ce qui est utile pour le rendu côté serveur afin de garantir une sortie cohérente sur le serveur et le client. Notez que côté serveur, vous devez pousser manuellement l'emplacement initial alors que côté client, le routeur le récupère automatiquement à partir de l'URL.

**Signature:**

```typescript
isReady(): Promise<void>
```

### onError

Ajoute un gestionnaire d'erreur qui est appelé chaque fois qu'une erreur non capturée se produit pendant la navigation. Cela inclut les erreurs lancées de manière synchrone et asynchrone, les erreurs renvoyées ou passées à `next` dans n'importe quelle garde de navigation, et les erreurs survenues en essayant de résoudre un composant asynchrone qui est nécessaire pour rendre une route.

**Signature:**

```typescript
onError(handler: (error: any, to: RouteLocationNormalized, from: RouteLocationNormalized) => any): () => void
```

_Parameters_

| Parameter | Type                                                                              | Description               |
| --------- | --------------------------------------------------------------------------------- | ------------------------- |
| handler   | `(error: any, to: RouteLocationNormalized, from: RouteLocationNormalized) => any` | gestionnaire d'erreur à enregistrer |

### push

Naviguez de façon programmée vers une nouvelle URL en poussant une entrée dans la pile de l'historique.

**Signature:**

```typescript
push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
```

_Parameters_

| Parameter | Type                                    | Description                   |
| --------- | --------------------------------------- | ----------------------------- |
| to        | [`RouteLocationRaw`](#routelocationraw) | Emplacement de l'itinéraire vers lequel naviguer |

### removeRoute

Supprimer une route existante par son nom.

**Signature:**

```typescript
removeRoute(name: string | symbol): void
```

_Parameters_

| Parameter | Type               | Description                 |
| --------- | ------------------ | --------------------------- |
| name      | `string \| symbol` | Nom de la route à supprimer |

### replace

Naviguer de façon programmée vers une nouvelle URL en remplaçant l'entrée actuelle dans la pile de l'historique.

**Signature:**

```typescript
replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
```

_Parameters_

| Parameter | Type                                    | Description                   |
| --------- | --------------------------------------- | ----------------------------- |
| to        | [`RouteLocationRaw`](#routelocationraw) | Emplacement de l'itinéraire vers lequel naviguer |

### resolve

Renvoie la [version normalisée](#routelocation) d'un [emplacement de route](#routelocationraw). Inclut également une propriété `href` qui inclut toute `base` existante.

**Signature:**

```typescript
resolve(to: RouteLocationRaw): RouteLocation & {
  href: string
}
```

_Parameters_

| Parameter | Type                                    | Description                   |
| --------- | --------------------------------------- | ----------------------------- |
| to        | [`RouteLocationRaw`](#routelocationraw) | Emplacement de la route brute à résoudre |

## RouterOptions

### history

Implémentation de l'historique utilisée par le routeur. La plupart des applications web devraient utiliser `createWebHistory` mais cela nécessite que le serveur soit correctement configuré. Vous pouvez aussi utiliser un historique basé sur un _hash_ avec `createWebHashHistory` qui ne nécessite aucune configuration sur le serveur mais qui n'est pas du tout traité par les moteurs de recherche et qui a un mauvais effet sur le référencement.

**Signature:**

```typescript
history: RouterHistory
```

#### Examples

```js
createRouter({
  history: createWebHistory(),
  // autres options...
})
```

### linkActiveClass

Classe par défaut appliquée aux [RouterLink] (#router-link-props) actifs. Si aucun n'est fourni, `router-link-active` sera appliqué.

**Signature:**

```typescript
linkActiveClass?: string
```

### linkExactActiveClass

Classe par défaut appliquée aux [RouterLink] (#router-link-props) actifs exacts. Si aucun n'est fourni, `router-link-exact-active` sera appliqué.

**Signature:**

```typescript
linkExactActiveClass?: string
```

### parseQuery

Implémentation personnalisée pour analyser une requête. Elle doit décoder les clés et les valeurs de la requête. Voir son homologue, [stringifyQuery](#stringifyquery).

**Signature:**

```typescript
parseQuery?: (searchQuery: string) => Record<string, (string | null)[] | string | null>
```

#### Exemples

Disons que vous voulez utiliser le paquetage [qs](https://github.com/ljharb/qs) pour analyser les requêtes, vous pouvez fournir à la fois `parseQuery` et `stringifyQuery` :

```js
import qs from 'qs'

createRouter({
  // autres options...
  parseQuery: qs.parse,
  stringifyQuery: qs.stringify,
})
```

### routes

Liste initiale des routes qui doivent être ajoutées au routeur.

**Signature:**

```typescript
routes: RouteRecordRaw[]
```

### scrollBehavior

Fonction permettant de contrôler le défilement lors de la navigation entre les pages. Peut retourner une Promise pour retarder le moment où le défilement se produit. Voir [Scroll Behaviour](../guide/advanced/scroll-behavior.md) pour plus de détails.

**Signature:**

```typescript
scrollBehavior?: RouterScrollBehavior
```

#### Exemples

```js
function scrollBehavior(to, from, savedPosition) {
  // `to` et `from` sont tous deux des emplacements de route.
  // `savedPosition` peut être nul s'il n'y en a pas.
}
```

### stringifyQuery

Implémentation personnalisée de la chaîne de caractères d'un objet de requête. Ne devrait pas ajouter un `?` en tête. Doit encoder correctement les clés et les valeurs des requêtes. Contrepartie de [parseQuery](#parsequery) pour gérer l'analyse des requêtes.

**Signature:**

```typescript
stringifyQuery?: (
  query: Record<
    string | number,
    string | number | null | undefined | (string | number | null | undefined)[]
  >
) => string
```

## RouteRecordRaw

Enregistrement de route qui peut être fourni par l'utilisateur lorsqu'il ajoute des routes via l'option [`routes`](#routeroptions) ou via [`router.addRoute()`](#addroute-2). Il y a trois différents types d'enregistrements de routes :

- Les enregistrements de vues simples : ont une option `component`.
- Les enregistrements de vues multiples ([named views](../guide/essentials/named-views.md)) : ont une option `component`.
- Enregistrements de redirection : ne peuvent pas avoir d'option `component` ou `components` car un enregistrement de redirection n'est jamais atteint.

### path

- **Type**: `string`
- **Détails**:

  Chemin d'accès de l'enregistrement. Doit commencer par `/` sauf si l'enregistrement est l'enfant d'un autre enregistrement.
  Peut définir des paramètres : `/users/:id` correspond à `/users/1` ainsi qu'à `/users/posva`.

- **Voir Aussi**: [Dynamic Route Matching](../guide/essentials/dynamic-matching.md)

### redirect

- **Type**: `RouteLocationRaw | (to: RouteLocationNormalized) => RouteLocationRaw` (Optional)
- **Détails**:

  Où rediriger si la route est en correspondance directe. La redirection se fait
  avant toute garde de navigation et déclenche une nouvelle navigation avec la nouvelle cible
  cible. Il peut également s'agir d'une fonction qui reçoit l'emplacement de l'itinéraire cible et qui
  renvoie l'emplacement vers lequel nous devons rediriger.

### children

- **Type**: Array of [`RouteRecordRaw`](#routerecordraw) (Optional)
- **Détails**:

  Itinéraires imbriqués de l'enregistrement actuel.

- **Voir Aussi**: [Nested Routes](../guide/essentials/nested-routes.md)

### alias

- **Type**: `string | string[]` (Optional)
- **Détails**:

  Alias pour l'itinéraire. Permet de définir des chemins supplémentaires qui se comporteront comme une
  copie de l'enregistrement. Cela permet de raccourcir les chemins comme `/users/:id` et
  `/u/:id`. **Toutes les valeurs `alias` et `path` doivent partager les mêmes paramètres**.

### name

- **Type**: `string | symbol` (Optional)
- **Détails**:

  Nom unique pour l'enregistrement de l'itinéraire.

### beforeEnter

- **Type**: [`NavigationGuard | NavigationGuard[]`](#navigationguard) (Optional)
- **Détails**:

  Avant d'entrer la garde spécifique à cet enregistrement. Notez que `beforeEnter` n'a aucun effet si l'enregistrement a une propriété `redirect`.

### props

- **Type**: `boolean | Record<string, any> | (to: RouteLocationNormalized) => Record<string, any>` (En option)
- **Détails**:

 Permet de passer des paramètres comme props au composant rendu par `router-view`. Lorsqu'il est passé à _multiple views record_, il doit être un objet avec les mêmes clés que `components` ou un `boolean` à appliquer à chaque composant.
  emplacement cible.

- **Voir Aussi**: [Passer les props aux composants de l'itinéraire](../guide/essentials/passing-props.md)

### meta

- **Type**: [`RouteMeta`](#routemeta) (Optional)
- **Détails**:

  Données personnalisées attachées à l'enregistrement.

- **Voir Aussi**: [Champs méta](../guide/advanced/meta.md)

:::tip
Si vous voulez utiliser un composant fonctionnel, assurez-vous de lui ajouter un `displayName`.
:::
Par exemple:

```js
const HomeView = () => h('div', 'HomePage')
// en TypeScript, vous devrez utiliser le type FunctionalComponent

HomeView.displayName = 'HomeView'
const routes = [{ path: '/', component: HomeView }]
```

:::

## RouteRecordNormalized

Version normalisée d'un [Enregistrement de l'itinéraire](#routerecordraw)

### aliasOf

- **Type**: `RouteRecordNormalized | undefined`
- **Détails**:

  Définit si cet enregistrement est l'alias d'un autre. Cette propriété est `undefined` si l'enregistrement est l'original.

### beforeEnter

- **Type**: [`NavigationGuard`](#navigationguard)
- **Détails**:

  La garde de navigation est appliquée lorsque l'on entre dans cet enregistrement depuis un autre endroit.

- **Voir Aussi**: [Protections de la navigation](../guide/advanced/navigation-guards.md)

### children

- **Type**: Tableau d'[enregistrements d'itinéraire](#routerecordnormalized) normalisés
- **Détails**:

  Enregistrements des enfants d'un itinéraire au moment où il a été ajouté. Tableau vide si aucun. Notez que ce tableau n'est pas mis à jour lorsque `addRoute()` et `removeRoute()` sont appelés.

### components

- **Type**: `Record<string, Component>`
- **Détails**:

  Dictionnaire des vues nommées, s'il n'y en a pas, contient un objet avec la clé `default`.

### meta

- **Type**: `RouteMeta`
- **Détails**:

  Données arbitraires jointes à l'enregistrement.

- **Voir Aussi**: [Meta fields](../guide/advanced/meta.md)

### name

- **Type**: `string | symbol | undefined`
- **Détails**:

  Nom de l'enregistrement de l'itinéraire. `undefined` si aucun n'a été fourni.

### path

- **Type**: `string`
- **Détails**:

  Chemin normalisé de l'enregistrement. Inclut le `path` de tout parent.

### props

- **Type**: `Record<string, boolean | Function | Record<string, any>>`
- **Détails**:

  Dictionnaire de l'option [`props`](#props) pour chaque vue nommée. S'il n'y en a pas, il ne contiendra qu'une seule propriété nommée `default`.

### redirect

- **Type**: [`RouteLocationRaw`](#routelocationraw)
- **Détails**:

  Où rediriger si l'itinéraire correspond directement. La redirection se produit avant toute garde de navigation et déclenche une nouvelle navigation avec le nouvel emplacement cible.

## RouteLocationRaw

Emplacement de l'itinéraire au niveau de l'utilisateur qui peut être passé à `router.push()`, `redirect`, et retourné dans [Navigation Guards](../guide/advanced/navigation-guards.md).

Un emplacement brut peut être soit une `string` comme `/users/posva#bio` ou un objet :

```js
// ces trois formes sont équivalentes
router.push('/users/posva#bio')
router.push({ path: '/users/posva', hash: '#bio' })
router.push({ name: 'users', params: { username: 'posva' }, hash: '#bio' })
// ne change que le hash
router.push({ hash: '#bio' })
// ne change que la requête
router.push({ query: { page: '2' } })
// changer un paramètre
router.push({ params: { username: 'jolyne' } })
```

Notez que `path` doit être fourni encodé (par exemple, `phantom blood` devient `phantom%20blood`) alors que `params`, `query` et `hash` ne le doivent pas, ils sont encodés par le routeur.

Les emplacements de route bruts supportent aussi une option supplémentaire `replace` pour appeler `router.replace()` au lieu de `router.push()` dans les gardes de navigation. Notez que ceci appelle aussi en interne `router.replace()` même en appelant `router.push()` :

```js
router.push({ hash: '#bio', replace: true })
// équivalent à
router.replace({ hash: '#bio' })
```

## RouteLocation

Résolu [RouteLocationRaw](#routelocationraw) qui peut contenir des [redirect records](#routerecordraw). En outre, il possède les mêmes propriétés que [RouteLocationNormalized](#routelocationnormalized).

## RouteLocationNormalized

Emplacement normalisé de l'itinéraire. N'a pas de [redirect records](#routerecordraw). Dans les gardes de navigation, `to` et `from` sont toujours de ce type.

### fullPath

- **Type**: `string`
- **Détails**:

  URL codée associée à l'emplacement de l'itinéraire. Contient `path`, `query` et `hash`.

### hash

- **Type**: `string`
- **Détails**:

  Section `hash` décodée de l'URL. Commence toujours par un `#`. Chaîne vide s'il n'y a pas de `hash` dans l'URL.

### query

- **Type**: `Record<string, string | string[]>`
- **Détails**:

  Dictionnaire des paramètres de requête décodés extraits de la section `search` de l'URL.

### matched

- **Type**: [`RouteRecordNormalized[]`](#routerecordnormalized)
- **Détails**:

  Tableau des [enregistrements d'itinéraires normalisés](#routerecord) qui correspondent à l'emplacement de l'itinéraire donné.

### meta

- **Type**: `RouteMeta`
- **Détails**:

  Données arbitraires attachées à tous les enregistrements appariés et fusionnées (de manière non récursive) de parent à enfant.

- **See also**: [Meta fields](../guide/advanced/meta.md)

### name

- **Type**: `string | symbol | undefined | null`
- **Détails**:

  Nom de l'enregistrement de l'itinéraire. `undefined` si aucun n'a été fourni.

### params

- **Type**: `Record<string, string | string[]>`
- **Détails**:

  Dictionnaire des paramètres décodés extraits de `path`.

### path

- **Type**: `string`
- **Détails**:

  Section `pathname` encodée de l'URL associée à l'emplacement de l'itinéraire.

### redirectedFrom

- **Type**: [`RouteLocation`](#routelocation)
- **Détails**:

  Emplacement de l'itinéraire auquel nous avons initialement essayé d'accéder avant d'aboutir à l'emplacement actuel lorsqu'une option `redirect` a été trouvée ou qu'un garde de navigation a appelé `next()` avec un emplacement d'itinéraire. `undefined` s'il n'y a pas eu de redirection.

## NavigationFailure

### from

- **Type**: [`RouteLocationNormalized`](#routelocationnormalized)
- **Détails**:

  Emplacement de la route à partir duquel nous naviguions

### to

- **Type**: [`RouteLocationNormalized`](#routelocationnormalized)
- **Détails**:

  Emplacement de la route vers laquelle nous naviguons

### type

- **Type**: [`NavigationFailureType`](#navigationfailuretype)
- **Détails**:

  Type d'échec de la navigation.

- **Voir Aussi**: [Défaillances de la navigation](../guide/advanced/navigation-failures.md)

## NavigationGuard

- **Arguments**:

  - [`RouteLocationNormalized`](#routelocationnormalized) to - Itinéraire vers lequel nous naviguons.
  - [`RouteLocationNormalized`](#routelocationnormalized) from - Emplacement de l'itinéraire à partir duquel nous naviguons.
  - `Function` next (Facultatif) - Appel pour valider la navigation

- **Détails** :

  Fonction qui peut être passée pour contrôler la navigation d'un routeur. Le callback `next` peut être omis si vous retournez une valeur (ou une Promise) à la place, ce qui est encouragé. Les valeurs de retour possibles (et les paramètres pour `next`) sont :

  - `undefined | void | true` : valide la navigation
  - `false` : annule la navigation
  - `RouteLocationRaw`](#routelocationraw) : redirige vers un emplacement différent
  - `(vm : ComponentPublicInstance) => any` **uniquement pour `beforeRouteEnter`** : Un callback à exécuter une fois la navigation terminée. Reçoit l'instance du composant de la route comme paramètre.

- **Voir Aussi**: [Gardes de navigation](../guide/advanced/navigation-guards.md)

## Injections de composants

### Propriétés injectées dans les composants

Ces propriétés sont injectées dans chaque composant enfant en appelant `app.use(router)`.

- **this.\$router**

  L'instance du routeur.

- **this.\$route**

  Le [emplacement de l'itinéraire](#routelocationnormalized) actif actuel. Cette propriété est en lecture seule et ses propriétés sont immuables, mais elle peut être surveillée.

### Options d'activation du composant

- **beforeRouteEnter**
- **beforeRouteUpdate**
- **beforeRouteLeave**

Voir [Gardes des composants](../guide/advanced/navigation-guards.md#in-component-guards).
