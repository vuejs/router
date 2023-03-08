# 不同的历史模式

<VueSchoolLink
  href="https://vueschool.io/lessons/history-mode"
  title="Learn about the differences between Hash Mode and HTML5 Mode"
/>

在创建路由器实例时，`history` 配置允许我们在不同的历史模式中进行选择。

## Hash 模式

hash 模式是用 `createWebHashHistory()` 创建的：

```js
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    //...
  ],
})
```

它在内部传递的实际 URL 之前使用了一个哈希字符（`#`）。由于这部分 URL 从未被发送到服务器，所以它不需要在服务器层面上进行任何特殊处理。不过，**它在 SEO 中确实有不好的影响**。如果你担心这个问题，可以使用 HTML5 模式。

## HTML5 模式

用 `createWebHistory()` 创建 HTML5 模式，推荐使用这个模式：

```js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    //...
  ],
})
```

当使用这种历史模式时，URL 会看起来很 "正常"，例如 `https://example.com/user/id`。漂亮!

不过，问题来了。由于我们的应用是一个单页的客户端应用，如果没有适当的服务器配置，用户在浏览器中直接访问 `https://example.com/user/id`，就会得到一个 404 错误。这就尴尬了。

不用担心：要解决这个问题，你需要做的就是在你的服务器上添加一个简单的回退路由。如果 URL 不匹配任何静态资源，它应提供与你的应用程序中的 `index.html` 相同的页面。漂亮依旧!

## 服务器配置示例

**注意**：以下示例假定你正在从根目录提供服务。如果你部署到子目录，你应该使用[Vue CLI 的 `publicPath` 配置](https://cli.vuejs.org/config/#publicpath)和相关的[路由器的 `base` 属性](../../api/#Functions-createWebHistory)。你还需要调整下面的例子，以使用子目录而不是根目录（例如，将`RewriteBase/` 替换为 `RewriteBase/name-of-your-subfolder/`）。

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

也可以使用 [`FallbackResource`](https://httpd.apache.org/docs/2.2/mod/mod_dir.html#fallbackresource) 代替 `mod_rewrite`。

### nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### 原生 Node.js

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

### Express + Node.js

对于 Node.js/Express，可以考虑使用 [connect-history-api-fallback 中间件](https://github.com/bripkens/connect-history-api-fallback)。

### Internet Information Services (IIS)

1. 安装 [IIS UrlRewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
2. 在网站的根目录下创建一个 `web.config` 文件，内容如下：

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

将此添加到你的 `firebase.json` 中：

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

创建一个 `_redirects` 文件，包含在你的部署文件中：

```
/* /index.html 200
```

在 vue-cli、nuxt 和 vite 项目中，这个文件通常放在名为 `static` 或 `public` 的目录下。

你可以在 [Netlify 文档](https://docs.netlify.com/routing/redirects/rewrites-proxies/#history-pushstate-and-single-page-apps)中找到更多关于语法的信息。你也可以[创建一个 `netlify.toml`](https://docs.netlify.com/configure-builds/file-based-configuration/) 来结合其他 Netlify 功能的重定向。

### Vercel

在项目根目录创建一个`vercel.json`文件，内容如下：

```json
{
  "rewrites": [{ "source": "/:path*", "destination": "/index.html" }]
}
```

## Caveat

这有一个注意事项。你的服务器将不再报告 404 错误，因为现在所有未找到的路径都会显示你的 `index.html` 文件。为了解决这个问题，你应该在你的 Vue 应用程序中实现一个万能的路由来显示 404 页面。

```js
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:pathMatch(.*)', component: NotFoundComponent }],
})
```

另外，如果你使用的是 Node.js 服务器，你可以通过在服务器端使用路由器来匹配传入的 URL，如果没有匹配到路由，则用 404 来响应，从而实现回退。查看 [Vue 服务器端渲染文档](https://v3.cn.vuejs.org/guide/ssr/introduction.html#what-is-server-side-rendering-ssr)了解更多信息。
