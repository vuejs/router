// Global compile-time constants
declare var __DEV__: boolean
declare var __TEST__: boolean
// TODO: refactor all these feature flags
declare var __FEATURE_PROD_DEVTOOLS__: boolean
// iifee build cannot have v8 devtools because they are too heavy
declare var __STRIP_DEVTOOLS__: boolean
declare var __BROWSER__: boolean
