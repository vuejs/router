# Des modes History différents

<VueSchoolLink 
  href="https://vueschool.io/lessons/history-mode"
  title="Learn about the differences between Hash Mode and HTML5 Mode"
/>

L'option `history` lors de la création de l'instance du routeur nous permet de choisir parmi différents modes d'historique.

## Mode hachage

Le mode d'historique hash est créé avec `createWebHashHistory()` :

```js
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    //...
  ],
})
```

Il utilise un caractère de hachage (`#`) avant l'URL réelle qui est transmise en interne. Comme cette section de l'URL n'est jamais envoyée au serveur, elle ne nécessite aucun traitement spécial au niveau du serveur. **Il a cependant un mauvais impact en matière de référencement**. Si c'est un problème pour vous, utilisez le mode historique HTML5.

## Mode HTML5

Le mode HTML5 est créé avec `createWebHistory()` et est le mode recommandé :

```js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    //...
  ],
})
```

En utilisant le mode historique, l'URL sera "normale", par exemple `https://example.com/user/id`. Magnifique !

Mais il y a un problème : Puisque notre application est une page unique côté client, sans une configuration serveur appropriée, les utilisateurs obtiendront une erreur 404 s'ils accèdent à `https://example.com/user/id` directement dans leur navigateur. Et ça, c'est moche.

Ne vous inquiétez pas : pour résoudre ce problème, il suffit d'ajouter une route de repli simple et universelle à votre serveur. Si l'URL ne correspond à aucun actif statique, il doit servir la même page `index.html` que celle où se trouve votre application. Magnifique, encore !

## Exemples de configurations de serveur

**Note** : Les exemples suivants supposent que vous servez votre application à partir du dossier racine. Si vous déployez vers un sous-dossier, vous devez utiliser [l'option `publicPath` de Vue CLI](https://cli.vuejs.org/config/#publicpath) et la propriété [`base` du routeur](../../api/#createwebhistory). Vous devez également adapter les exemples ci-dessous pour utiliser le sous-dossier au lieu du dossier racine (par exemple en remplaçant `RewriteBase /` par `RewriteBase /nom-de-votre-sous-dossier/`).

### Apache

```apacheconf
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Au lieu de `mod_rewrite`, vous pouvez aussi utiliser [`FallbackResource`](https://httpd.apache.org/docs/2.2/mod/mod_dir.html#fallbackresource).

### nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Native Node.js

```js
const http = require('http')
const fs = require('fs')
const httpPort = 80

http
  .createServer((req, res) => {
    fs.readFile('index.html', 'utf-8', (err, content) => {
      if (err) {
        console.log('We cannot open "index.html" file.')
      }

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
      })

      res.end(content)
    })
  })
  .listen(httpPort, () => {
    console.log('Server listening on: http://localhost:%s', httpPort)
  })
```

### Express with Node.js

Pour Node.js/Express, envisagez d'utiliser le middleware [connect-history-api-fallback] (https://github.com/bripkens/connect-history-api-fallback).

### Internet Information Services (IIS)

1. Installer [IIS UrlRewrite] (https://www.iis.net/downloads/microsoft/url-rewrite)
2. Créez un fichier `web.config` dans le répertoire racine de votre site avec ce qui suit :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Handle History Mode and custom 404/500" stopProcessing="true">
          <match url="(.*)" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### Caddy v2

```
try_files {path} /
```

### Caddy v1

```
rewrite {
    regexp .*
    to {path} /
}
```

### Firebase hosting

Ajoutez ceci à votre `firebase.json` :

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Netlify

Créez un fichier `_redirects` qui est inclus avec vos fichiers déployés :

```
/* /index.html 200
```

Dans les projets vue-cli, nuxt, et vite, ce fichier se trouve généralement dans un dossier nommé `static` ou `public`.

Vous pouvez en savoir plus sur la syntaxe sur [Netlify documentation](https://docs.netlify.com/routing/redirects/rewrites-proxies/#history-pushstate-and-single-page-apps). Vous pouvez également [créer un `netlify.toml`](https://docs.netlify.com/configure-builds/file-based-configuration/) pour combiner les _redirections_ avec d'autres fonctionnalités de Netlify.

## Caveat

Il y a une mise en garde à ce sujet : Votre serveur ne signalera plus les erreurs 404 car tous les chemins non trouvés servent maintenant votre fichier `index.html`. Pour contourner ce problème, vous devez implémenter une route "catch-all" dans votre application Vue pour afficher une page 404 :

```js
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:pathMatch(.*)', component: NotFoundComponent }],
})
```

Sinon, si vous utilisez un serveur Node.js, vous pouvez mettre en œuvre la solution de repli en utilisant le routeur côté serveur pour faire correspondre l'URL entrante et répondre par 404 si aucune route ne correspond. Consultez la [documentation sur le rendu côté serveur de Vue](https://v3.vuejs.org/guide/ssr/introduction.html#what-is-server-side-rendering-ssr) pour plus d'informations.
