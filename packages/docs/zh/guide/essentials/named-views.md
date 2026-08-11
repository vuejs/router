# 命名视图

<VueSchoolLink
  href="https://vueschool.io/lessons/vue-router-4-named-views"
  title="Learn how to use named views"
/>

有时候想同时 (同级) 展示多个视图，而不是嵌套展示，例如创建一个布局，有 `sidebar` (侧导航) 和 `main` (主内容) 两个视图，这个时候命名视图就派上用场了。你可以在界面中拥有多个单独命名的视图，而不是只有一个单独的出口。如果 `router-view` 没有设置名字，那么默认为 `default`。

```vue-html
<router-view name="sidebar" />
<router-view />
<router-view name="footer" />
```

一个视图使用一个组件渲染，因此对于同一个路由，多个视图就需要多个组件。确保正确使用 `components` 配置（带上 **s**）：

```js
const router = createRouter({
  // ...
  routes: [
    {
      path: '/',
      components: {
        default: Home, // 渲染到 <router-view />
        sidebar: MainSidebar, // 渲染到 <router-view name="sidebar" />
        footer: MainToolbar, // 渲染到 <router-view name="footer" />
      },
    },
  ],
})
```

- [在演练场中查看](https://play.vuejs.org/#eNq1Vm1v2zYQ/iuEMsAOZkt29oJBU410RbFuWLuiKfql6gdaomzVEimQlOPA8H/vkZRoSmbSfKkRx9Ld8xyPx4dHHoMalzT8KoI4KOuGcYmOKOMES/KyadAJFZzVaLJvySSlFsBZKwm33jAyhjNEcXsfbprQ8FNqI0/he51ShMJWkKmhm/eatVROJ1dAm1wHs6CjQ36JJHVTAX+lgMl2uXqHa5KjTyW5F0kE79re6B94EJIzulm9ajknVJqkUYPlNk6izoeOR/STdoRFW1XvwYlOJx0mMnESivd9wA86zf9KukOSvUiDKA1WfzN4Rm9YTZLo7H+UgddgsbSX6u1ZPEGkLOlGWOpdZ7hgJ1GfcZKXe5RVWAiIkDEqoQrA74bAosxNJfWrWYL5HmqJKJQVKAqwxjwNUNSTIpeVKOn4I5wJFpNEkI55KhgDZA/xjGwAduAksowkckQA6jBkr37fkprxhzelkPAz64ymWK6u51a7Vr1qNZWorIR7Q6fjDvYWpnZnamSRju0S/JGxagzubEOw1sUgA2sZAnsVDLCu0Q8fZz2y+0nj7Ed2u8fJQdNAcKLbdBy9GJR/elSrujUrE/uWa3o9UxDNFjH6bKSiaeqjNzGaRBONUp+MQbIUBA5oC0MoJwVuKxnbJbUEhDp5x+46Om4jOePtpmi9p+7pNLvMSe/w5ydmF/bHZ9b3kOcn5yrJl99IN54cRyLx5Kl+v8D/E7R/2NDuVvP0/JtVD4CGfzNsCMAebT9vAAfjjWFkP69xA22FUYihS5N2DmjBtlhpcG4gypwGWykbEUdRS5vdJoT6RmfE7W/hIvwd2qCQjjUkop6vObsXuo+lQVeZNLgFUJSTvYTaiTluyseGuADe/hEuw+V5JNd3MZ4aDo68E0xdCti1RbkZTVzJpKwI/7+RJezqQQFwVbH7f7VN8pbY5LMtyXYe+1dxMNN4zwlksCfOhCXmGwJHlHK/vntHDvBsnTXL2wrQTzg/EMGqVuVoYH+1NIe0HZzO9h+9jqDKj+L1AQ5F0U9KJaqrofF6cV89MfVzur+EvzpVHLX1R0XYYbwiHPR7bwSL8PLHZ4A3hAt6Msr3ttQI92Ss71VmhPPGEvKhIiLMhDr2YQvoq41ZGNA8wOBUKSpy+BMWRB1JFqJuIwan3DFaAgKBlW9KOq9IAT1vuWgsD25SM6SvPDNNnXV9zYRYM56rHnfTHBAIr8zR1WKxcCOumZSsvohp6A3Oc5go8EfeFcLoZ/hq1CA3F7m9MQAM5zRW4gS3gEN1s63gK500YmSS8g54uyMPBYdrl8PtKqTO+U7sa5ztNtCvaD7PWMVg0ldFYaLq2zJcSB9FSo6paLC6g/cE+AtO3wDyWC1R)

## 嵌套命名视图

我们也有可能使用命名视图创建嵌套视图的复杂布局。这时你也需要命名用到的嵌套 `router-view` 组件。我们以一个设置面板为例：

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

- `Nav` 只是一个常规组件。
- `UserSettings` 是一个父级视图组件。
- `UserEmailsSubscriptions`、`UserProfile`、`UserProfilePreview` 是嵌套的视图组件。

**注意**：_我们先忘记 HTML/CSS 具体的布局的样子，只专注在用到的组件上。_

`UserSettings` 组件的 `<template>` 部分应该是类似下面的这段代码:

```vue-html [UserSettings.vue]
<div>
  <h1>User Settings</h1>
  <NavBar />
  <router-view />
  <router-view name="helper" />
</div>
```

那么你就可以通过这个路由配置来实现上面的布局：

```js
{
  path: '/settings',
  // 你也可以在顶级路由就配置命名视图
  component: UserSettings,
  children: [
    {
      path: 'emails',
      component: UserEmailsSubscriptions
    },
    {
      path: 'profile',
      components: {
        default: UserProfile,
        helper: UserProfilePreview
      }
    }
  ]
}
```

- [在演练场中查看](https://play.vuejs.org/#eNqVVglr40YU/iuDtmAHIsnedNuiOibtEmgLTcOmLZS6LIo1trQZacQcjkPwf+83hy5bye4GHMvvft+79ByUaVFFn2SQBEVZc6HIM1kLmir6U12TA9kIXpLJTtPJqmoFBNeKipYbxY7QiRjdhpfWdeT0V5WTi2ot8+kkllSpotrKmCIIJidnkcppNZ2ekcsleV5VpItkis+ZoRASaUmnzlBDKbmu1HTyBq4moB3wCc4D7xiZLRQtawZLS6OwyOfLGyoVzchNWuL/3wV9lIsYZMuu7RcepBK82i7fayFopVzWpE5VnixizyPPz+Qby4g2mrFbMMnhYM3Ezs7ChRru4ITEIC3iXjQI02MyVoLfacnF0y+FVPg698QPQ/CRYdjC3xbgL0nFnYe3rUSf6EvSE7+2RbjT93ItiloVvBpqjvBPjdwKvikYHSh62ovCt4JacEZ0PKvtH7q3ymv49vUQ5HKAy9T2Te4gS8ZwnJ6dGxGrLRPyryu2VTN/tr6ka86JlTZ/cUz+4RrONctIyiQnebqjpLI9ZMKUJFUELUwUrxulNUe+FdonGdSkNbrOC5ahvdpABsH0AvIz0iqOGB+pUCd9OB81WzugX7ALfAZKhGR0k2rmHfoqDXQBPmU1FQMJX8e+nB2So8f/3IP9jWc/x8dtawbaZUhQJG3GbKTrb9LdaOOD7tsJQ2ytQB8/hisiK3ZkzVIpL1eBlqugWQn526UxRhpr2BpvG96xdzPsltHfAJ3Rjx/Rxgogr4JxUdNYkHRwQmhElfSew7CVdOYWMbIYWTgjaJzuSM0G/qp014HAimUTKCuqB7Q7pI63OcTdw8JfByu7XMTQ/jI7vjVhyD+9YGkRazZME0m6jgjLtMZm5RUStI288gyE17b2Kuh2qCEDcqVqmcSxruqHbYRpiDuJq3fRLPoO0ErVo0ZUluG94I/AFg5XgZ+JVXAFoTijO8U5k2FaFy+5OBG8+iGaR/POU5934s+4w9wckLqS6IhNsT1K3Aw1QBR/+M3QByBljD/+ZmlK6GagoZPT9cMI/ZPcuzQw2IhghyK1PJWKLUVTG/b13Q3d47llljzTpqSvMD9QyZk2MTqxn3WVIeyenI32V1tHNMqf8nqP/pdNUiZQi4aVt8V9/0rqXbgX0bc9FF85eafT4gbNbYiLpVUjAzXsiYuXhtI7653JzzrICkWeuBaknYwvNd+7qJ/z0txlvvkaX1I9MSqjtTTvM1FvYEO6T9cqxKfA1XSvd5xxHAqgVKJVfwTwZhXjBc+x77nIzCGZ13uCnigy8mY2m0HMXK8sQ+0TMiOz6J2gpf+yTEwMwsH134oisxTzEDZRhnCrywq3LdWKk/lGjMiY0XICI8wUbxUyaToopynCxNkzX24SDRkr07youA3fJzZrusk3f+vStT6M6cTb6gFiN/CJGGg2uleAKtHeRRWKYpvjaM+i71uUOgijC0frnDXn5dihp7/u9MRMc5lG0jTkfpx4czIB+SCtJVwiq8ewB0PbXUgcbydHSfSsuF9WmRVJxdU0wSlTId+E6qmmZ87eEJl5A4sn33OleNmPJTj8D6FKcrI=)

<RuleKitLink />
