<script setup lang="ts">
definePage({
  name: false,
})
</script>

<template>
  <div>
    <h2>Nested root</h2>

    <h4>string url</h4>
    <nav>
      <ul>
        <li>
          <RouterLink to="/nested" v-slot="{ href }">{{ href }}</RouterLink>
        </li>
        <li>
          <RouterLink to="/nested/" v-slot="{ href }">{{ href }}</RouterLink>
        </li>
        <li>
          <RouterLink to="/nested/other" v-slot="{ href }">{{
            href
          }}</RouterLink>
        </li>
      </ul>
    </nav>

    <h4>named locations</h4>
    <nav>
      <ul>
        <!-- <li> -->
        <!--   <RouterLink :to="{ name: '/nested' }" v-slot="{ href }">{{ -->
        <!--     href -->
        <!--   }}</RouterLink> -->
        <!-- </li> -->
        <li>
          <RouterLink :to="{ name: '/nested/' }" v-slot="{ href }">{{
            href
          }}</RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: '/nested/other' }" v-slot="{ href }">{{
            href
          }}</RouterLink>
        </li>
      </ul>
    </nav>

    <RouterView />
  </div>
</template>

<style scoped>
.router-link-active {
  color: orange;
}

.router-link-exact-active {
  color: red;
}
</style>
