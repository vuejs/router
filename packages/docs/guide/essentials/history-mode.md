# Different History modes

<VueSchoolLink
  href="https://vueschool.io/lessons/history-mode"
  title="Learn about the differences between Hash Mode and HTML5 Mode"
/>

The `history` option when creating the router instance allows us to choose among different history modes.

## Hash Mode

The hash history mode is created with `createWebHashHistory()`:

```js
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    //...
  ],
})
```

It uses a hash character (`#`) before the actual URL that is internally passed. Because this section of the URL is never sent to the server, it doesn't require any special treatment on the server level. **It does however have a bad impact in SEO**. If that's a concern for you, use the HTML5 history mode.

## HTML5 Mode

The HTML5 mode is created with `createWebHistory()` and is the recommended mode:

```js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    //...
  ],
})
```

When using `createWebHistory()`, the URL will look "normal," e.g. `https://example.com/user/id`. Beautiful!

Here comes a problem, though: Since our app is a single page client side app, without a proper server configuration, the users will get a 404 error if they access `https://example.com/user/id` directly in their browser. Now that's ugly.

Not to worry: To fix the issue, all you need to do is add a simple catch-all fallback route to your server. If the URL doesn't match any static assets, it should serve the same `index.html` page that your app lives in. Beautiful, again!

## Memory mode

The memory history mode doesn't assume a browser environment and therefore doesn't interact with the URL **nor automatically triggers the initial navigation**. This makes it perfect for Node environment and SSR. It is created with `createMemoryHistory()` and **requires you to push the initial navigation** after calling `app.use(router)`.

```js
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    //...
  ],
})
```

While it's not recommended, you can use this mode inside Browser applications but note **there will be no history**, meaning you won't be able to go _back_ or _forward_.

## Example Server Configurations

**Note**: The following examples assume you are serving your app from the root folder. If you deploy to a subfolder, you should use [the `publicPath` option of Vue CLI](https://cli.vuejs.org/config/#publicpath) and the related [`base` property of the router](../../api/#Functions-createWebHistory). You also need to adjust the examples below to use the subfolder instead of the root folder (e.g. replacing `RewriteBase /` with `RewriteBase /name-of-your-subfolder/`).

### Apache

```
<IfModule mod_negotiation.c>
  Options -MultiViews
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Instead of `mod_rewrite`, you could also use [`FallbackResource`](https://httpd.apache.org/docs/2.4/mod/mod_dir.html#fallbackresource).

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

For Node.js/Express, consider using [connect-history-api-fallback middleware](https://github.com/bripkens/connect-history-api-fallback).

### Internet Information Services (IIS)

1. Install [IIS UrlRewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
2. Create a `web.config` file in the root directory of your site with the following:

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

Add this to your `firebase.json`:

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

Create a `_redirects` file that is included with your deployed files:

```
/* /index.html 200
```

In vue-cli, nuxt, and vite projects, this file usually goes under a folder named `static` or `public`.

You can read more about the syntax on [Netlify documentation](https://docs.netlify.com/routing/redirects/rewrites-proxies/#history-pushstate-and-single-page-apps). You can also [create a `netlify.toml`](https://docs.netlify.com/configure-builds/file-based-configuration/) to combine _redirections_ with other Netlify features.

### Vercel

Create a `vercel.json` file under the root directory of your project with the following:

```json
{
  "rewrites": [{ "source": "/:path*", "destination": "/index.html" }]
}
```

## Caveat

There is a caveat to this: Your server will no longer report 404 errors as all not-found paths now serve up your `index.html` file. To get around the issue, you should implement a catch-all route within your Vue app to show a 404 page:

```js
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:pathMatch(.*)', component: NotFoundComponent }],
})
```

Alternatively, if you are using a Node.js server, you can implement the fallback by using the router on the server side to match the incoming URL and respond with 404 if no route is matched. Check out the [Vue server side rendering documentation](https://v3.vuejs.org/guide/ssr/introduction.html#what-is-server-side-rendering-ssr) for more information.
