<template>
  <main>
    <h1>HMR Params Test</h1>
    <pre data-testid="param-id">{{ $route.params.id }}</pre>
    <pre data-testid="param-type">{{ typeof $route.params.id }}</pre>
  </main>
</template>
