# VueRouter

## API

### `Router`

```js
import { html5 as history, Router } from 'vue-router'

const router = new Router({
  history,
})
```

```html
<Router :history="html5">
  <Route component="Home" path="/" name="home" />
  <Route component="User" path="/users" name="user" />
</Router>
```

```html
<div class="user">
  <Router>
    <Route component="UserList" path="" name="list" />
    <Route component="UserDetail" path=":id" name="detail" />
    <Route component="UserNew" path="new" name="new" />
    <Route component="UserEdit" path=":id/edit" name="edit" props/>
  </Router>
</div>
```
