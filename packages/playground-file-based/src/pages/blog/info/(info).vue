<script lang="ts" setup></script>

<template>
  <h1>Blog Info - Index</h1>

  <ul>
    <li>
      <RouterLink
        :to="{
          name: '/blog/info/[[section]]',
          params: {
            section: null,
          },
        }"
        >Go to Section null</RouterLink
      >
    </li>
    <li>
      <RouterLink
        :to="{
          name: '/blog/info/[[section]]',
          params: {
            section: '1',
          },
        }"
        >Go to Section 1</RouterLink
      >
    </li>
  </ul>
</template>
