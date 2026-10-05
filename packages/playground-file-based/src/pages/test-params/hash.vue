<script setup lang="ts">
definePage({
  params: {
    hash: {
      section: { parser: 'test-hash-split', default: () => [] },
    },
  },
})
</script>

<template>
  <h1>Custom hash parser</h1>
  <p>
    The parser receives the hash contents without #. An absent hash skips the
    getter and uses the empty array default. A bare # calls the getter with an
    empty string and produces [""]. Other contents split into an array at each
    /.
  </p>
  <ul>
    <li>
      <RouterLink to="/test-params/hash">No hash → []</RouterLink>
    </li>
    <li><RouterLink to="/test-params/hash#">Bare # → [""]</RouterLink></li>
    <li>
      <RouterLink to="/test-params/hash#setup">#setup → ["setup"]</RouterLink>
    </li>
    <li>
      <RouterLink to="/test-params/hash#setup/vue">
        #setup/vue → ["setup", "vue"]
      </RouterLink>
    </li>
  </ul>
  <pre>{{ $route.params }}</pre>
  <RouterLink to="/">Hash without a custom parser</RouterLink>
</template>
