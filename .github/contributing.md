# Vue Router Contributing Guide

Hi! I'm really excited that you are interested in contributing to Vue Router. Before submitting your contribution, please make sure to take a moment and read through the following guidelines:

- [Code of Conduct](https://github.com/vuejs/vue/blob/dev/.github/CODE_OF_CONDUCT.md)
- [Issue Reporting Guidelines](#issue-reporting-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contributing Tests](#contributing-tests)
- [Financial Contribution](#financial-contribution)

## Issue Reporting Guidelines

- Always use [https://new-issue.vuejs.org/](https://new-issue.vuejs.org/) to create new issues.

## Pull Request Guidelines

- Checkout a topic branch from a base branch, e.g. `master`, and merge back against that branch.

- If adding a new feature:

  - Add accompanying test case.
  - Provide a convincing reason to add this feature. Ideally, you should open a suggestion issue first and have it approved before working on it.

- If fixing bug:

  - If you are resolving a special issue, add `(fix #xxxx[,#xxxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `update entities encoding/decoding (fix #3899)`.
  - Provide a detailed description of the bug in the PR. Live demo preferred.
  - Add appropriate test coverage if applicable. You can check the coverage of your code addition by running `yarn test --coverage`.

- It's OK to have multiple small commits as you work on the PR - GitHub can automatically squash them before merging.

- Make sure tests pass!

- Commit messages must follow the [commit message convention](./commit-convention.md) so that changelogs can be automatically generated. Commit messages are automatically validated before commit (by invoking [Git Hooks](https://git-scm.com/docs/githooks) via [yorkie](https://github.com/yyx990803/yorkie)).

- No need to worry about code style as long as you have installed the dev dependencies - modified files are automatically formatted with Prettier on commit (by invoking [Git Hooks](https://git-scm.com/docs/githooks) via [yorkie](https://github.com/yyx990803/yorkie)).

## Development Setup

You will need [Node.js](http://nodejs.org) **version 10+**, and [Yarn](https://classic.yarnpkg.com/en/docs/install).

After cloning the repo, run:

```bash
$ yarn # install the dependencies of the project
```

A high level overview of tools used:

- [TypeScript](https://www.typescriptlang.org/) as the development language
- [Rollup](https://rollupjs.org) for bundling
- [Jest](https://jestjs.io/) for unit testing
- [Prettier](https://prettier.io/) for code formatting

## Scripts

### `yarn build`

The `build` script builds vue-router

### `yarn dev`

The `dev` scripts starts a playground project located at `playground/` that allows you to test things on a browser.

```bash
$ yarn dev
```

### `yarn test`

The `yarn test` script runs all checks:

- _Typings_: `test:types`
- _Linting_: `test:lint`
- _Unit tests_: `test:unit`
- _Building_: `build`

```bash
# run all tests
$ yarn test

# run unit tests in watch mode
$ yarn jest --watch
```

## Project Structure

Vue Router source code can be found in the `src` directory:

- `src/components`: RouterLink and RouterView components.
- `src/history`: history implementations that are instantiable with `create*History()`. This folder contains code related to using the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API).
- `src/matcher`: RouteMatcher implementation. Contains the code that transforms paths like `/users/:id` into regexes and handle the transformation of locations like `{ name: 'UserDetail', params: { id: '2' } }` to strings. It contains path ranking logic and the part of dynamic routing that concerns matching urls in the right order.
- `src/utils`: contains util functions that are used accross other sections of the router but are not contained by them.
- `src/router`: contains the router creation, navigation execution, using the matcher, the history implementation. It runs navigation guards.
- `src/index`: contains all public API as exports.
- `src/types`: contains global types that are used across multiple sections of the router.

## Contributing Tests

Unit tests are located inside `__tests__`. Consult the [Jest docs](https://jestjs.io/docs/en/using-matchers) and existing test cases for how to write new test specs. Here are some additional guidelines:

- Use the minimal API needed for a test case. For example, if a test can be written without involving the reactivity system or a component, it should be written so. This limits the test's exposure to changes in unrelated parts and makes it more stable.
- Use the minimal API needed for a test case. For example, if a test concerns the `router-link` component, don't create a router instance, mock the needed properties instead.
- Write a unit test whenever possible
- If a test is specific to a browser, create an e2e (end to end) test and make sure to indicate it on the test

## Credits

Thank you to all the people who have already contributed to Vue Router!

<a href="https://github.com/vuejs/vue/graphs/contributors"><img src="https://opencollective.com/vuejs/contributors.svg?width=890" /></a>
