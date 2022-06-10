<template>
  <div>
    <div>Repeated Params</div>
    <router-link :to="lessNesting">Less nesting</router-link>
    <br />
    <router-link :to="moreNesting">More nesting</router-link>
    <pre>{{ moreNesting }}</pre>
    <pre>{{ lessNesting }}</pre>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'RepeatedParams',

  setup() {
    const route = useRoute()

    const lessNesting = computed(() => {
      const a = [...(route.params.a || [])]
      a.pop()

      return { params: { a } }
    })

    const moreNesting = computed(() => {
      const a = [...(route.params.a || [])]
      a.push('more')

      return { params: { a } }
    })

    return { lessNesting, moreNesting }
  },
})
</script>
