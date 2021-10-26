# Routes nommées

<VueSchoolLink 
  href="https://vueschool.io/lessons/named-routes"
  title="Learn about the named routes"
/>

En plus du `path`, vous pouvez fournir un `name` à n'importe quelle route. Cela présente les avantages suivants :

- Pas d'URLs codées en dur
- Encodage/décodage automatique des `paramètres`.
- Évite les fautes de frappe dans l'URL
- Contournement du classement des chemins (par exemple, pour afficher un )

```js
const routes = [
  {
    path: '/user/:username',
    name: 'user',
    component: User
  }
]
```

Pour créer un lien avec une route nommée, vous pouvez passer un objet à la propriété `to` du composant `router-link` :

```html
<router-link :to="{ name: 'user', params: { username: 'erina' }}">
  User
</router-link>
```

C'est exactement le même objet que celui utilisé de manière programmatique avec `router.push()` :

```js
router.push({ name: 'user', params: { username: 'erina' } })
```

Dans les deux cas, le routeur naviguera vers le chemin `/user/erina`.

Exemple complet [ici](https://github.com/vuejs/vue-router/blob/dev/examples/named-routes/app.js).
