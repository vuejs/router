# Récupération de données

Parfois, vous avez besoin de récupérer des données du serveur lorsqu'une route est activée. Par exemple, avant de rendre le profil d'un utilisateur, vous devez récupérer les données de l'utilisateur depuis le serveur. Nous pouvons y parvenir de deux manières différentes :

- **Récupération après la navigation** : effectuez d'abord la navigation, puis récupérez les données dans le crochet de cycle de vie du composant entrant. Afficher un état de chargement pendant que les données sont récupérées.

- **Récupération avant la navigation** : Récupérer les données avant la navigation dans la garde d'entrée de l'itinéraire, et effectuer la navigation après la récupération des données.

Techniquement, les deux choix sont valables - cela dépend en fin de compte de l'expérience utilisateur que vous souhaitez obtenir.

## Récupération après la navigation

En utilisant cette approche, nous naviguons et rendons le composant entrant immédiatement, et récupérons les données dans le hook `created` du composant. Cela nous donne la possibilité d'afficher un état de chargement pendant que les données sont récupérées sur le réseau, et nous pouvons également gérer le chargement différemment pour chaque vue.

Supposons que nous ayons un composant `Post` qui a besoin de récupérer les données d'un post basé sur `$route.params.id` :

```html
<template>
  <div class="post">
    <div v-if="loading" class="loading">Loading...</div>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="post" class="content">
      <h2>{{ post.title }}</h2>
      <p>{{ post.body }}</p>
    </div>
  </div>
</template>
```

```js
export default {
  data() {
    return {
      loading: false,
      post: null,
      error: null,
    }
  },
  created() {
    // regarder les paramètres de la route pour récupérer les données à nouveau
    this.$watch(
      () => this.$route.params,
      () => {
        this.fetchData()
      },
      // récupérer les données lorsque la vue est créée et que les données sont
      // déjà en cours d'observation
      { immediate: true }
    )
  },
  methods: {
    fetchData() {
      this.error = this.post = null
      this.loading = true
      // remplacez `getPost` par votre utilitaire de récupération de données / wrapper API.
      getPost(this.$route.params.id, (err, post) => {
        this.loading = false
        if (err) {
          this.error = err.toString()
        } else {
          this.post = post
        }
      })
    },
  },
}
```

## Récupération avant la navigation

Avec cette approche, nous récupérons les données avant de naviguer vers la nouvelle route. Nous pouvons effectuer la récupération des données dans la garde `beforeRouteEnter` du composant entrant, et n'appeler `next` que lorsque la récupération est terminée :

```js
export default {
  data() {
    return {
      post: null,
      error: null,
    }
  },
  beforeRouteEnter(to, from, next) {
    getPost(to.params.id, (err, post) => {
      next(vm => vm.setData(err, post))
    })
  },
  // lorsque la route change et que ce composant est déjà rendu,
  // la logique sera légèrement différente.
  async beforeRouteUpdate(to, from) {
    this.post = null
    try {
      this.post = await getPost(to.params.id)
    } catch (error) {
      this.error = error.toString()
    }
  },
}
```

L'utilisateur restera sur la vue précédente pendant que la ressource est extraite pour la vue suivante. Il est donc recommandé d'afficher une barre de progression ou un autre type d'indicateur pendant la récupération des données. Si la récupération des données échoue, il est également nécessaire d'afficher un message d'avertissement global.

<!-- ### Using Composition API -->

<!-- TODO: -->
