# Loaders Organization

While most examples show loaders defined in the same file as the page component, it's possible to define them in separate files and import them in the page component. This flexibility allows you to control not only the codebase organization but also **how chunks are split**.

If a loader is used in multiple pages, it might be a better idea to extract it to a separate file instead of exporting it in one page and importing it in the others. This is because pages importing it will usually load the whole page component chunk in order to get the loader.

::: code-group

```ts [loaders/issues.ts]
import { defineBasicLoader } from 'vue-router/experimental'
import { getIssuesByProjectId } from '@/api'

export const useProjectIssues = defineBasicLoader('/[projectId]/issues', to =>
  getIssuesByProjectId(to.params.projectId)
)
```

```vue{2-3,7} [pages/[projectId]/issues.vue]
<script lang="ts">
import { useProjectIssues } from '@/loaders/issues'
export { useProjectIssues }
</script>

<script setup lang="ts">
const { data: issues } = useProjectIssues()
</script>
```

```vue{2,4,9} [pages/[projectId]/insights.vue]
<script lang="ts">
import { useProjectIssues } from '@/loaders/issues'
import { useProjectPullRequests } from '@/loaders/pull-requests'
export { useProjectIssues, useProjectPullRequests }
</script>

<script setup lang="ts">
const { data: issues } = useProjectIssues()
const { data: pullRequests } = useProjectPullRequests()
</script>
```

:::

<!-- TODO: talk about auto export plugin for loaders -->

In the example above, the `useProjectIssues` loader is defined in a separate file and imported in two different pages, `pages/[projectId]/issues.vue` and `pages/[projectId]/insights.vue`. They both use the same data but present it in a different way so there is no reason to create two different loaders for issues. By extracting the loader into a separate file, we ensure an optimal chunk split.

When using this pattern, remember to **export the loader** in all the page components that use it. This is what allows the router to await the loader before rendering the page.

## Usage outside of page components

Until now, we have only seen loaders used in page components. However, one of the benefits of using loaders is that they can be **reused in many parts of your application**, just like regular composables. This will not only eliminate code duplication but also ensure an optimal and performant data fetching by **deduplicating requests and sharing the data**.

To use a loader outside of a page component, you can simply **import it** and use it like any other composable, without the need to export it.

```vue
<script setup lang="ts">
// You can even import it from the page component
import { useProjectIssues } from '@/pages/[projectId]/issues.vue'

const { data: issues } = useProjectIssues()
</script>
```

::: tip

When using a loader in a non-page component, you must **export the loader** from the page components where it is used. If you only import and use the loader in a regular component, the router will not recognize it and won't trigger or await it during navigation.

:::

## Nested Routes

When defining nested routes, you don't need to worry about exporting the loader in both the parent and the child components. This will be automatically optimized for you and the loader will be shared between the parent and the child components.
Because of this, it's simpler to **always export data loaders** in the page component where **they are used**.
