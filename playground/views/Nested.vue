<template>
  <div>
    <p>Nested level {{ level }}</p>
    <ul v-if="level === 1">
      <li>
        <router-link to="/nested/nested">/nested/nested</router-link>
      </li>
      <li>
        <router-link to="/anidado/nested">/anidado/nested</router-link>
      </li>
      <li>
        <router-link to="/anidado/a">/anidado/a</router-link>
      </li>
      <li>
        <router-link to="/nested/a">/nested/a</router-link>
      </li>
      <li>
        <router-link to="/nested/a/nested">/nested/a/nested</router-link>
      </li>
      <li>
        <router-link to="/nested/nested/nested"
          >/nested/nested/nested</router-link
        >
      </li>
      <li>
        <router-link to="/anidado/a/nested">/anidado/a/nested</router-link>
      </li>
      <li>
        <router-link to="/anidado/nested/nested"
          >/anidado/nested/nested</router-link
        >
      </li>
      <li>
        <router-link to="/anidado/other">/anidado/other</router-link>
      </li>
      <li>
        <router-link to="/nested/other">/nested/other</router-link>
      </li>
      <li>
        <router-link to="/nested/otherAlias">/nested/otherAlias</router-link>
      </li>
      <li>
        <router-link to="/anidado/otherAlias">/anidado/otherAlias</router-link>
      </li>
      <li>
        <router-link to="/nested/also-as-absolute"
          >/nested/also-as-absolute</router-link
        >
      </li>
      <li>
        <router-link to="/absolute">/absolute</router-link>
      </li>
      <li>
        <router-link :to="{ name: 'absolute-child' }"
          >/absolute (named)</router-link
        >
      </li>
    </ul>
    <router-view v-if="level < 6"></router-view>
  </div>
</template>

<script>
import { defineComponent, inject, provide } from 'vue'
// import { guardSymbol } from '../../src/components/View'

export default defineComponent({
  name: 'Nested',
  setup() {
    const level = inject('level', 1)
    provide('level', level + 1)
    // const registerGuard = inject(guardSymbol)
    // await registerGuard()
    // console.log('done waiting')

    return {
      level,
    }
  },
})
</script>
