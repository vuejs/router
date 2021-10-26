# Vues nommées

Parfois vous avez besoin d'afficher plusieurs vues en même temps au lieu de les imbriquer, par exemple en créant un layout avec une vue `sidebar` et une vue `main`. C'est là que les vues nommées sont utiles. Au lieu d'avoir une seule sortie dans votre vue, vous pouvez en avoir plusieurs et donner un nom à chacune d'elles. Une `router-view` sans nom se verra attribuer `default` comme nom.

```html
<router-view class="view left-sidebar" name="LeftSidebar"></router-view>
<router-view class="view main-content"></router-view>
<router-view class="view right-sidebar" name="RightSidebar"></router-view>
```

Une vue est rendue par l'utilisation d'un composant, donc plusieurs vues nécessitent plusieurs composants pour la même route. Assurez-vous d'utiliser l'option `components` (avec un **s**) :

```js
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      components: {
        default: Home,
        // abréviation de LeftSidebar : LeftSidebar
        LeftSidebar,
        // ils correspondent à l'attribut `name` de `<router-view>`.
        RightSidebar,
      },
    },
  ],
})
```

Une démonstration fonctionnelle de cet exemple peut être trouvée [ici](https://codesandbox.io/s/named-views-vue-router-4-examples-rd20l).

## Vues nommées imbriquées

Il est possible de créer des mises en page complexes en utilisant des vues nommées avec des vues imbriquées. En faisant cela, vous devrez également donner un nom aux `router-view` imbriquées. Prenons l'exemple d'un panneau de paramètres :

```
/settings/emails                                       /settings/profile
+-----------------------------------+                  +------------------------------+
| UserSettings                      |                  | UserSettings                 |
| +-----+-------------------------+ |                  | +-----+--------------------+ |
| | Nav | UserEmailsSubscriptions | |  +------------>  | | Nav | UserProfile        | |
| |     +-------------------------+ |                  | |     +--------------------+ |
| |     |                         | |                  | |     | UserProfilePreview | |
| +-----+-------------------------+ |                  | +-----+--------------------+ |
+-----------------------------------+                  +------------------------------+
```

- `Nav` est juste un composant ordinaire.
- `UserSettings` est le composant de vue parent.
- `UserEmailsSubscriptions`, `UserProfile`, `UserProfilePreview` sont des composants de vue imbriqués.

**Note** : _Oublions la façon dont le HTML/CSS devrait ressembler pour représenter une telle mise en page et concentrons-nous sur les composants utilisés_.

La section `<template>` du composant `UserSettings` dans la mise en page ci-dessus ressemblerait à ceci :

```html
<!-- UserSettings.vue -->
<div>
  <h1>User Settings</h1>
  <NavBar />
  <router-view />
  <router-view name="helper" />
</div>
```

Vous pouvez alors réaliser la disposition ci-dessus avec cette configuration de route :

```js
{
  path: '/settings',
  // Vous pouvez également avoir des vues nommées en haut de l'écran.
  component: UserSettings,
  children: [{
    path: 'emails',
    component: UserEmailsSubscriptions
  }, {
    path: 'profile',
    components: {
      default: UserProfile,
      helper: UserProfilePreview
    }
  }]
}
```

Une démonstration fonctionnelle de cet exemple peut être trouvée [ici](https://codesandbox.io/s/nested-named-views-vue-router-4-examples-re9yl?&initialpath=%2Fsettings%2Femails).
