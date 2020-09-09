<template>
  <button class="button">
    <component :is="svgComponent" />
  </button>
</template>

<script>
import { defineComponent, shallowRef, watch } from 'vue'

export default defineComponent({
  props: {
    icon: String,
  },

  setup(props) {
    const svgComponent = shallowRef()

    watch(
      () => props.icon,
      async icon => {
        svgComponent.value = (
          await import(`../example-preview/icons/${icon}.vue`)
        ).default
      },
      { immediate: true }
    )

    return { svgComponent }
  },
})
</script>

<style scoped>
.button {
  /* reset button style */
  border: none;
  padding: 0;
  width: auto;
  overflow: visible;
  background: transparent;
  font: inherit;
  /* acutal styles */
  color: rgb(135, 135, 135);
  font-size: 1.5rem;
  line-height: 0.5;
  vertical-align: middle;
  text-align: center;
  margin: 0px 0.1rem;
}

.button:not([disabled]):hover {
  background-color: rgb(226, 226, 226);
  cursor: pointer;
}

.button[disabled] {
  color: rgb(192, 192, 192);
}
</style>
