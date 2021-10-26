# Getting Started

<VueMasteryVideo
  title="Get Started with Vue Router"
  url="https://player.vimeo.com/video/548250062"
  img="/Vue_Router_-_Getting_Started.jpeg"
/>

<script setup>
  import VueMasteryVideo from '../../.vitepress/components/VueMasteryVideo.vue'
  </script>

Créer une application monopage avec Vue + Vue Router semble naturel : avec Vue.js, nous composons déjà notre application avec des composants. Lorsque nous ajoutons Vue Router au mélange, tout ce que nous devons faire est de mapper nos composants aux routes et de laisser Vue Router savoir où les rendre. Voici un exemple de base :

## HTML

```html
<script src="https://unpkg.com/vue@3"></script>
<script src="https://unpkg.com/vue-router@4"></script>

<div id="app">
  <h1>Hello App!</h1>
  <p>
    <!-- utiliser le composant routeur-lien pour la navigation. -->
    <!-- spécifier le lien en passant la prop `to`. -->
    <!-- `<router-link>` rendra une balise `<a>` avec l'attribut `href` correct -->
    <router-link to="/">Go to Home</router-link>
    <router-link to="/about">Go to About</router-link>
  </p>
  <!-- route outlet -->
  <!-- le composant correspondant à la route sera rendu ici -->
  <router-view></router-view>
</div>
```

### `router-link`

Notez qu'au lieu d'utiliser les balises `a` ordinaires, nous utilisons un composant personnalisé `router-link` pour créer des liens. Cela permet à Vue Router de changer l'URL sans recharger la page, de gérer la génération de l'URL ainsi que son encodage. Nous verrons plus tard comment tirer parti de ces fonctionnalités.

### `router-view`

`router-view` affichera le composant qui correspond à l'url. Vous pouvez le mettre n'importe où pour l'adapter à votre mise en page.

## JavaScript

```js
// 1. Définir les composants de l'itinéraire.
// Ceux-ci peuvent être importés d'autres fichiers
const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

// 2. Définir quelques routes
// Chaque route doit correspondre à un composant.
// Nous parlerons plus tard des routes imbriquées.
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
]

// 3. Créer l'instance du routeur et passer l'option `routes`.
// Vous pouvez passer d'autres options ici, mais restons simples pour l'instant.
// restons simples pour l'instant.
const router = VueRouter.createRouter({
  // 4. fournir l'implémentation de l'historique à utiliser. Nous utilisons l'historique de hachage pour plus de simplicité ici.
  history: VueRouter.createWebHashHistory(),
  routes, // short for `routes: routes`
})

// 5. Créer et monter l'instance racine.
const app = Vue.createApp({})
// Assurez-vous d'_utiliser_ l'instance de routeur pour rendre l'application
// l'ensemble de l'application soit compatible avec le routeur.
app.use(router)

app.mount('#app')

// L'application a maintenant démarré !
```

En appelant `app.use(router)`, nous y avons accès en tant que `this.$router` ainsi que la route actuelle en tant que `this.$route` à l'intérieur de n'importe quel composant :

```js
// Home.vue
export default {
  computed: {
    username() {
      // Nous verrons bientôt ce qu'est `params`.
      return this.$route.params.username
    },
  },
  methods: {
    goToDashboard() {
      if (isAuthenticated) {
        this.$router.push('/dashboard')
      } else {
        this.$router.push('/login')
      }
    },
  },
}
```

Pour accéder au routeur ou à la route dans la fonction `setup`, appelez les fonctions `useRouter` ou `useRoute`. Nous en apprendrons davantage à ce sujet dans [l'API de composition](./advanced/composition-api.md#accessing-the-router-and-current-route-inside-setup).

Dans la documentation, nous utiliserons souvent l'instance `router`. Gardez à l'esprit que `this.$router` est exactement la même chose que d'utiliser directement l'instance `router` créée par `createRouter`. La raison pour laquelle nous utilisons `this.$router` est que nous ne voulons pas importer le routeur dans chaque composant qui a besoin de manipuler le routage.
