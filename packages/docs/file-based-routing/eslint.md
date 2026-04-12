# ESLint

## Configuration

If you are not using auto imports, you will need to tell ESLint about `vue-router/auto-routes`. Add these lines to your eslint configuration:

```json{3}
{
  "settings": {
    "import/core-modules": ["vue-router/auto-routes"]
  }
}
```

If you face [multi-word-component-names](https://eslint.vuejs.org/rules/multi-word-component-names.html) warning, you can omit that rule from specific files or folders by adding these lines to your eslint configuration:

```json{3}
{
    files: ['src/pages/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    }
}
```


## `definePage()`

Since `definePage()` is a global macro, you need to tell ESLint about it. Add these lines to your eslint configuration:

```json{3}
{
  "globals": {
    "definePage": "readonly"
  }
}
```
