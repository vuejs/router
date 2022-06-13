import {
  RouteRecordRaw,
  RouteNamedMap,
  RouteStaticPathMap,
  RouteLocationNamedRaw,
} from '.'
import { defineComponent } from 'vue'

const Home = defineComponent({})
const User = defineComponent({})
const LongView = defineComponent({})
const component = defineComponent({})

function defineRoutes<R extends Readonly<RouteRecordRaw[]>>(routes: R): R {
  return routes
}

const routes = [
  { path: '/home', redirect: '/' },
  {
    path: '/',
    components: { default: Home, other: component },
  },
  {
    path: '/always-redirect',
    component,
  },
  { path: '/users/:id', name: 'user', component: User, props: true },
  { path: '/documents/:id', name: 'docs', component: User, props: true },
  { path: '/optional/:id?', name: 'optional', component: User, props: true },
  { path: encodeURI('/n/€'), name: 'euro', component },
  { path: '/n/:n', name: 'increment', component },
  { path: '/multiple/:a/:b', name: 'multiple', component },
  { path: '/long-:n', name: 'long', component: LongView },
  {
    path: '/lazy',
    component,
  },
  {
    path: '/with-guard/:n',
    name: 'guarded',
    component,
  },
  { path: '/cant-leave', component },
  {
    path: '/children',
    name: 'WithChildren',
    component,
    children: [
      { path: '', alias: 'alias', name: 'default-child', component },
      { path: 'a', name: 'a-child', component },
      {
        path: 'b',
        name: 'WithChildrenB',
        component,
        children: [
          {
            path: '',
            name: 'b-child',
            component,
          },
          { path: 'a2', component },
          { path: 'b2', component },
        ],
      },
    ],
  },
  { path: '/with-data', component, name: 'WithData' },
  { path: '/rep/:a*', component, name: 'repeat' },
  { path: '/:data(.*)', component, name: 'NotFound' },
  {
    path: '/nested',
    alias: '/anidado',
    component,
    name: 'Nested',
    children: [
      {
        path: 'nested',
        alias: 'a',
        name: 'NestedNested',
        component,
        children: [
          {
            name: 'NestedNestedNested',
            path: 'nested',
            component,
          },
        ],
      },
      {
        path: 'other',
        alias: 'otherAlias',
        component,
        name: 'NestedOther',
      },
      {
        path: 'also-as-absolute',
        alias: '/absolute',
        name: 'absolute-child',
        component,
      },
    ],
  },

  {
    path: '/parent/:id',
    name: 'parent',
    component,
    props: true,
    alias: '/p/:id',
    children: [
      // empty child
      { path: '', name: 'child-id', component },
      // child with absolute path. we need to add an `id` because the parent needs it
      { path: '/p_:id/absolute-a', alias: 'as-absolute-a', component },
      // same as above but the alias is absolute
      { path: 'as-absolute-b', alias: '/p_:id/absolute-b', component },
    ],
  },
  {
    path: '/dynamic',
    name: 'dynamic',
    component,
    end: false,
    strict: true,
  },

  {
    path: '/admin',
    children: [
      { path: '', component },
      { path: 'dashboard', component },
      { path: 'settings', component },
    ],
  },
] as const

function pushStr(route: keyof RouteStaticPathMap<typeof routes>) {}
pushStr('')

// function push1(
//   route: RouteNamedMap<typeof routes>[keyof RouteNamedMap<typeof routes>]
// ) {}
// push1({ })
function pushEnd(route: keyof RouteNamedMap<typeof routes>) {}

pushEnd('NotFound')

function push(
  route:
    | keyof RouteStaticPathMap<typeof routes>
    | {
        name: keyof RouteNamedMap<typeof routes>
      }
) {}
