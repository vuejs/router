<template>
  <main>
    <h1>Home</h1>

    <pre data-testid="meta-hello">{{ $route.meta.hello }}</pre>
  </main>
</template>

<route lang="json">
{
  "meta": {
    "hello": "world"
  }
}
</route>
