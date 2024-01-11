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
- Here is a template to report a bug: [https://codesandbox.io/s/vue-router-v4-reproduction-tk1y7](https://codesandbox.io/s/vue-router-v4-reproduction-tk1y7). Please use it when reporting a bug

## Pull Request Guidelines

- Check out a topic branch from a base branch, e.g. `main`, and merge back against that branch.

- If adding a new feature:

  - Add accompanying test case.
  - Provide a convincing reason to add this feature. Ideally, you should open a suggestion issue first and have it approved before working on it.

- If fixing bug:

  - If you are resolving a particular issue, add `(fix #xxxx[,#xxxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `update entities encoding/decoding (fix #3899)`.
  - Provide a detailed description of the bug in the PR. Live demo preferred.
  - Add appropriate test coverage if applicable. You can check the coverage of your code addition by running `pnpm test --coverage`.

- It's OK to have multiple small commits as you work on the PR - GitHub can automatically squash them before merging.

- Make sure tests pass!

- Commit messages must follow the [commit message convention](./commit-convention.md) so that the changelog can be automatically generated. Commit messages are automatically validated before commit (by invoking [Git Hooks](https://git-scm.com/docs/githooks) via [yorkie](https://github.com/yyx990803/yorkie)).

- No need to worry about code style as long as you have installed the dev dependencies - modified files are automatically formatted with Prettier on commit (by invoking [Git Hooks](https://git-scm.com/docs/githooks) via [yorkie](https://github.com/yyx990803/yorkie)).

## Development Setup

You will need [Node.js](http://nodejs.org) **version 10+**, and [Pnpm](https://pnpm.io/installation).

After cloning the repo, run:

```bash
pnpm install # install the dependencies of the project
```

A high-level overview of tools used:

- [TypeScript](https://www.typescriptlang.org/) as the development language
- [Rollup](https://rollupjs.org) for bundling
- [Jest](https://jestjs.io/) for unit testing
- [Prettier](https://prettier.io/) for code formatting

## Scripts

### `pnpm build`

The `build` script builds vue-router

### `pnpm play`

The `play` script starts a playground project located at `playground/`, allowing you to test things on a browser.

```bash
pnpm play
```

### `pnpm test`

The `pnpm test` script runs all checks:

- _Typings_: `test:types`
- _Linting_: `test:lint`
- _Unit tests_: `test:unit`
- _Building_: `build`

```bash
# run all tests
$ pnpm test

# run unit tests in watch mode
$ pnpm jest --watch
```

## Project Structure

Vue Router source code can be found in the `src` directory:

- `src/history`: history implementations that are instantiable with `create*History()`. This folder contains code related to using the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API).
- `src/matcher`: RouteMatcher implementation. Contains the code that transforms paths like `/users/:id` into regexps and handles the transformation of locations like `{ name: 'UserDetail', params: { id: '2' } }` to strings. It contains path ranking logic and the part of dynamic routing that concerns matching URLs in the correct order.
- `src/utils`: contains small utility functions used across other router
- `src/router`: contains the router creation, navigation execution, matcher use, and history implementation. It runs navigation guards.
- `src/location`: helpers related to route location and URLs
- `src/encoding`: helpers related to URL encoding
- `src/errors`: different internal and external errors with their messages
- `src/index` contains all public APIs as exports.
- `src/types`: contains global types used across multiple router sections.

## Contributing Tests

Unit tests are located inside `__tests__`. Consult the [Jest docs](https://jestjs.io/docs/en/using-matchers) and existing test cases for how to write new test specs. Here are some additional guidelines:

- Use the minimal API needed for a test case. For example, if a test can be written without involving the reactivity system or a component, it should be written so. This limits the test's exposure to changes in unrelated parts and makes it more stable.
- Use the minimal API needed for a test case. For example, if a test concerns the `router-link` component, don't create a router instance, mock the required properties instead.
- Write a unit test whenever possible
- If a test is specific to a browser, create an e2e (end-to-end) test and make sure to indicate it on the test

## Contributing Docs

All the documentation files can be found in `packages/docs`. It contains the English markdown files while translation(s) are stored in their corresponding `<lang>` sub-folder(s):

- [`zh`](https://github.com/vuejs/router/tree/main/packages/docs/zh): Chinese translation.

Besides that, the `.vitepress` sub-folder contains the config and theme, including the i18n information.

Contributing to the English docs is the same as contributing to the source code. You can create a pull request to our GitHub repo. However, if you would like to contribute to the translations, there are two options and some extra steps to follow:

### Translate in a `<lang>` sub-folder and host it on our official repo

If you want to start translating the docs in a _new_ language:

1. Create the corresponding `<lang>` sub-folder for your translation.
2. Modify the i18n configuration in the `.vitepress` sub-folder.
3. Translate the docs and run the doc site to self-test locally.
4. Create a checkpoint for your language by running `pnpm run docs:translation:update <lang> [<commit>]`. A checkpoint is the hash and date of the latest commit when you do the translation. The checkpoint information is stored in the status file `packages/docs/.vitepress/translation-status.json`. _It's crucial for long-term maintenance since all the further translation sync-ups are based on their previous checkpoints._ Usually, you can skip the commit argument because the default value is `main`.
5. Commit all the changes and create a pull request to our GitHub repo.

We will have a paragraph at the top of each translation page that shows the translation status. That way, users can quickly determine if the translation is up-to-date or lags behind the English version.

Speaking of the up-to-date translation, we also need good long-term maintenance for every language. If you want to _update_ an existing translation:

1. See what translation you need to sync up with the original docs. There are two popular ways:
   1. Via the [GitHub Compare](https://github.com/vuejs/router/compare/) page, only see the changes in `packages/docs/*` from the checkpoint hash to `main` branch. You can find the checkpoint hash for your language via the translation status file `packages/docs/.vitepress/translation-status.json`. The compare page can be directly opened with the hash as part of the URL, e.g. https://github.com/vuejs/router/compare/e008551...main
   2. Via a local command: `pnpm run docs:translation:compare <lang> [<commit>]`.
2. Create your own branch and start the translation update, following the previous comparison.
3. Create a checkpoint for your language by running `pnpm run docs:translation:update <lang> [<commit>]`.
4. Commit all the changes and create a pull request to our GitHub repo.

<!-- TODO: add an example once we have got one -->

### Self-host the translation

You can also host the translation on your own. To create one, fork our GitHub repo and change the content and site config in `packages/docs`. To long-term maintain it, we _highly recommend_ a similar way that we do above for our officially hosted translations:

- Ensure you maintain the _checkpoint_ properly. Also, ensure the _translation status_ is well-displayed on the top of each translation page.
- Utilize the diff result between the latest official repository and your own checkpoint to guide your translation.

Tip: you can add the official repo as a remote to your forked repo. This way, you can still run `pnpm run docs:translation:update <lang> [<commit>]` and `npm run docs:translation:compare <lang> [<commit>]` to get the checkpoint and diff result:

```bash
# prepare the upstream remote
git remote add upstream git@github.com:vuejs/router.git
git fetch upstream main

# set the checkpoint
pnpm run docs:translation:update <lang> upstream/main

# get the diff result
pnpm run docs:translation:compare <lang> upstream/main
```

<!-- TODO: add an example once we have got one -->

## Credits

Thank you to all the people who have already contributed to Vue Router!

<a href="https://github.com/vuejs/router/graphs/contributors"><img src="https://opencollective.com/vuejs/contributors.svg?width=890" /></a>
