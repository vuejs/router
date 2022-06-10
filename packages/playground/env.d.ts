/// <reference types="vite/client" />
/// <reference path="vue-router/global.d.ts"/>

declare module '*.vue' {
  import { Component } from 'vue'
  var component: Component
  export default component
}
