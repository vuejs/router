<script setup lang="ts">
const setOf = (...values: string[]) => new Set(values)
</script>

<template>
  <h1>Param parser tests</h1>

  <section>
    <h2>Required path <code>id: number</code></h2>
    <ul>
      <li>
        <RouterLink to="/test-params/req/42">/req/42</RouterLink>
      </li>
      <li>
        <RouterLink to="/test-params/req/oops">/req/oops (miss)</RouterLink>
      </li>
    </ul>
  </section>

  <section>
    <h2>Optional path <code>id: number | null</code></h2>
    <ul>
      <li><RouterLink to="/test-params/opt">/opt (none)</RouterLink></li>
      <li><RouterLink to="/test-params/opt/7">/opt/7</RouterLink></li>
      <li><RouterLink to="/test-params/opt/123">/opt/123</RouterLink></li>
    </ul>
  </section>

  <section>
    <h2>Repeatable path (1+) <code>id: number[]</code></h2>
    <ul>
      <li><RouterLink to="/test-params/rep/1">/rep/1</RouterLink></li>
      <li><RouterLink to="/test-params/rep/1/2/3">/rep/1/2/3</RouterLink></li>
    </ul>
  </section>

  <section>
    <h2>Optional repeatable path (0+) <code>id: number[]</code></h2>
    <ul>
      <li><RouterLink to="/test-params/repo">/repo (none)</RouterLink></li>
      <li><RouterLink to="/test-params/repo/1">/repo/1</RouterLink></li>
      <li><RouterLink to="/test-params/repo/1/2">/repo/1/2</RouterLink></li>
    </ul>
  </section>

  <section>
    <h2>
      Path-only parser (enum)
      <code>c: 'red' | 'green' | 'blue'</code>
    </h2>
    <ul>
      <li><RouterLink to="/test-params/color/red">/color/red</RouterLink></li>
      <li>
        <RouterLink to="/test-params/color/green">/color/green</RouterLink>
      </li>
      <li><RouterLink to="/test-params/color/blue">/color/blue</RouterLink></li>
      <li>
        <RouterLink to="/test-params/color/purple"
          >/color/purple (miss)</RouterLink
        >
      </li>
    </ul>
  </section>

  <section>
    <h2>
      Query parsers
      <code>page: number, tag: string[], active: boolean, ids: string[]</code>
    </h2>
    <ul>
      <li>
        <RouterLink to="/test-params/query">/query (defaults)</RouterLink>
      </li>
      <li>
        <RouterLink to="/test-params/query?page=3&tag=a&tag=b&active=1"
          >/query?page=3&amp;tag=a&amp;tag=b&amp;active=1</RouterLink
        >
      </li>
      <li>
        <RouterLink
          to="/test-params/query?page=3&tag=a&tag=b&active=1&ids=x,y,z"
          >/query?…&amp;ids=x,y,z</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/test-params/query?ids&ids=&ids=,,,&ids=,2,,64"
          >/query?ids&amp;ids=&amp;ids=,,,&amp;ids=,2,,64 (messy
          ids)</RouterLink
        >
      </li>
    </ul>
  </section>

  <section>
    <h2>Raw csv path params (test-csv)</h2>

    <h3>Required <code>ids: string[]</code></h3>
    <ul>
      <li>
        <RouterLink to="/test-params/raw/req/a">/raw/req/a</RouterLink>
      </li>
      <li>
        <RouterLink to="/test-params/raw/req/a,b,c">/raw/req/a,b,c</RouterLink>
      </li>
      <li>
        <RouterLink to="/test-params/raw/req/x,y,z,1,2"
          >/raw/req/x,y,z,1,2</RouterLink
        >
      </li>
    </ul>

    <h3>Optional <code>ids: string[]</code></h3>
    <ul>
      <li>
        <RouterLink to="/test-params/raw/opt">/raw/opt (none)</RouterLink>
      </li>
      <li>
        <RouterLink to="/test-params/raw/opt/a">/raw/opt/a</RouterLink>
      </li>
      <li>
        <RouterLink to="/test-params/raw/opt/x,y">/raw/opt/x,y</RouterLink>
      </li>
      <li>
        <RouterLink to="/test-params/raw/opt/1,2,3,4"
          >/raw/opt/1,2,3,4</RouterLink
        >
      </li>
    </ul>

    <h3>Repeatable (1+) <code>ids: string[]</code></h3>
    <ul>
      <li>
        <RouterLink to="/test-params/raw/rep/a">/raw/rep/a</RouterLink>
      </li>
      <li>
        <RouterLink to="/test-params/raw/rep/a/b/c">/raw/rep/a/b/c</RouterLink>
      </li>
      <li>
        <RouterLink to="/test-params/raw/rep/a,b/c,d"
          >/raw/rep/a,b/c,d</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/test-params/raw/rep/1,2/3/4,5,6"
          >/raw/rep/1,2/3/4,5,6</RouterLink
        >
      </li>
    </ul>

    <h3>Optional repeatable (0+) <code>ids: string[]</code></h3>
    <ul>
      <li>
        <RouterLink to="/test-params/raw/repo">/raw/repo (none)</RouterLink>
      </li>
      <li>
        <RouterLink to="/test-params/raw/repo/a">/raw/repo/a</RouterLink>
      </li>
      <li>
        <RouterLink to="/test-params/raw/repo/a/b/c"
          >/raw/repo/a/b/c</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/test-params/raw/repo/a,b/c"
          >/raw/repo/a,b/c</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/test-params/raw/repo/1,2/3/4,5"
          >/raw/repo/1,2/3/4,5</RouterLink
        >
      </li>
    </ul>
  </section>

  <section>
    <h2>Raw set path params (test-set)</h2>

    <h3>Required <code>ids: Set&lt;string&gt;</code></h3>
    <ul>
      <li>
        <RouterLink
          :to="{
            name: '/test-params/set/req.[ids]',
            params: { ids: setOf('a') },
          }"
          >set/req {a}</RouterLink
        >
      </li>
      <li>
        <RouterLink
          :to="{
            name: '/test-params/set/req.[ids]',
            params: { ids: setOf('a', 'b', 'a', 'c') },
          }"
          >set/req {a,b,c} (dupes dropped)</RouterLink
        >
      </li>
    </ul>

    <h3>Optional <code>ids: Set&lt;string&gt;</code></h3>
    <ul>
      <li>
        <RouterLink
          :to="{
            name: '/test-params/set/opt.[[ids]]',
            params: { ids: setOf() },
          }"
          >set/opt (empty)</RouterLink
        >
      </li>
      <li>
        <RouterLink
          :to="{
            name: '/test-params/set/opt.[[ids]]',
            params: { ids: setOf('x') },
          }"
          >set/opt {x}</RouterLink
        >
      </li>
      <li>
        <RouterLink
          :to="{
            name: '/test-params/set/opt.[[ids]]',
            params: { ids: setOf('x', 'y', 'z') },
          }"
          >set/opt {x,y,z}</RouterLink
        >
      </li>
    </ul>

    <h3>Repeatable (1+) <code>ids: Set&lt;string&gt;</code></h3>
    <ul>
      <li>
        <RouterLink
          :to="{
            name: '/test-params/set/rep.[ids]+',
            params: { ids: setOf('a') },
          }"
          >set/rep {a}</RouterLink
        >
      </li>
      <li>
        <RouterLink
          :to="{
            name: '/test-params/set/rep.[ids]+',
            params: { ids: setOf('a', 'b', 'c') },
          }"
          >set/rep {a,b,c}</RouterLink
        >
      </li>
      <li>
        <RouterLink
          :to="{
            name: '/test-params/set/rep.[ids]+',
            params: { ids: setOf('a', 'b', 'a', 'c', 'b') },
          }"
          >set/rep {a,b,c} (dupes dropped)</RouterLink
        >
      </li>
    </ul>

    <h3>Optional repeatable (0+) <code>ids: Set&lt;string&gt;</code></h3>
    <ul>
      <li>
        <RouterLink
          :to="{
            name: '/test-params/set/repo.[[ids]]+',
            params: { ids: setOf() },
          }"
          >set/repo (empty)</RouterLink
        >
      </li>
      <li>
        <RouterLink
          :to="{
            name: '/test-params/set/repo.[[ids]]+',
            params: { ids: setOf('a') },
          }"
          >set/repo {a}</RouterLink
        >
      </li>
      <li>
        <RouterLink
          :to="{
            name: '/test-params/set/repo.[[ids]]+',
            params: { ids: setOf('a', 'b', 'c', 'd') },
          }"
          >set/repo {a,b,c,d}</RouterLink
        >
      </li>
    </ul>
  </section>

  <section>
    <h2>Empty: <code>null</code> vs <code>[]</code> (optional repeatable)</h2>
    <p>
      <em
        >Does <code>set()</code> returning <code>null</code> for empty produce
        the same URL as returning <code>[]</code>?</em
      >
    </p>
    <ul>
      <li>
        <strong>null</strong> (test-set-shape):
        <RouterLink
          :to="{
            name: '/test-params/set-shape/repo.[[ids]]+',
            params: { ids: setOf() },
          }"
          >set-shape/repo (empty)</RouterLink
        >
      </li>
      <li>
        <strong>[]</strong> (test-set):
        <RouterLink
          :to="{
            name: '/test-params/set/repo.[[ids]]+',
            params: { ids: setOf() },
          }"
          >set/repo (empty)</RouterLink
        >
      </li>
    </ul>
  </section>
</template>
