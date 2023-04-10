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

- Checkout a topic branch from a base branch, e.g. `main`, and merge back against that branch.

- If adding a new feature:

  - Add accompanying test case.
  - Provide a convincing reason to add this feature. Ideally, you should open a suggestion issue first and have it approved before working on it.

- If fixing bug:

  - If you are resolving a special issue, add `(fix #xxxx[,#xxxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `update entities encoding/decoding (fix #3899)`.
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

A high level overview of tools used:

- [TypeScript](https://www.typescriptlang.org/) as the development language
- [Rollup](https://rollupjs.org) for bundling
- [Jest](https://jestjs.io/) for unit testing
- [Prettier](https://prettier.io/) for code formatting

## Scripts

### `pnpm build`

The `build` script builds vue-router

### `pnpm play`

The `play` scripts starts a playground project located at `playground/` that allows you to test things on a browser.

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
- `src/matcher`: RouteMatcher implementation. Contains the code that transforms paths like `/users/:id` into regexps and handle the transformation of locations like `{ name: 'UserDetail', params: { id: '2' } }` to strings. It contains path ranking logic and the part of dynamic routing that concerns matching urls in the right order.
- `src/utils`: contains small utility functions that are used across other sections of the router but are not contained by them.
- `src/router`: contains the router creation, navigation execution, using the matcher, the history implementation. It runs navigation guards.
- `src/location`: helpers related to route location and urls
- `src/encoding`: helpers related to url encoding
- `src/errors`: different internal and external errors with their messages
- `src/index`: contains all public API as exports.
- `src/types`: contains global types that are used across multiple sections of the router.

## Contributing Tests

Unit tests are located inside `__tests__`. Consult the [Jest docs](https://jestjs.io/docs/en/using-matchers) and existing test cases for how to write new test specs. Here are some additional guidelines:

- Use the minimal API needed for a test case. For example, if a test can be written without involving the reactivity system or a component, it should be written so. This limits the test's exposure to changes in unrelated parts and makes it more stable.
- Use the minimal API needed for a test case. For example, if a test concerns the `router-link` component, don't create a router instance, mock the needed properties instead.
- Write a unit test whenever possible
- If a test is specific to a browser, create an e2e (end to end) test and make sure to indicate it on the test

## Contributing Docs

Currently, all the docs can be found in `packages/docs`. It contains the English markdown files while translation(s) are stored in their corresponding `<lang>` sub-folder(s):

- [`zh`](https://github.com/vuejs/router/tree/main/packages/docs/zh): Chinese translation.

Besides that, the `.vitepress` sub-folder is used to put the config and theme, including the i18n information.

Consider the following two options in order to contribute to the translations:

### Translate in a `<lang>` sub-folder and host it on our official repo

If you want to start translating the docs in a new language:

1. Create the corresponding `<lang>` sub-folder for your translation.
2. Modify the i18n config in `.vitepress` sub-folder.
3. Translate the docs and run the doc site to self-test locally.
4. Once you have done all above, create a pull request to our GitHub repo.

If you want to maintain a existing translation:

1. (Repo permission required) First of all, make sure there is a _checkpoint_ branch for the language. Usually it's named as `docs-sync-<lang>`. Notice that:
    - This branch is always synced to the commit of the original docs that the latest translation of your language is corresponding to. Like `docs-sync-zh` is always to the commit of the original docs that the latest Chinese translation is corresponding to.
    - Technically, this checkpoint branch should be only updated if the translation is synced to a nearer commit of the original docs. Usually the commit is the HEAD of the `main` branch at that moment.
2. See what translation you need to do to sync up with the original docs. There are 2 popular ways:
	  - Git diff command: e.g. `git diff docs-sync-zh..main packages/docs # > debug.log`, or
	  - GitHub Compare page: e.g. https://github.com/vuejs/router/compare/docs-sync-zh...main (only see the changes in `packages/docs/*`)
3. Create your own branch and start the translation update, following the diff or compare.
4. Once you have done all above, create a pull request to our GitHub repo.
    - It's highly recommended to commit with message like `docs(<lang>): sync update to <the-latest-commit>`. e.g. `docs(zh): sync update to e008551`.
5. (Repo permission required) **VERY IMPORTANT**: after the pull request is merged, for the future batch of sync-up, do another merge from the latest commit at that moment to the checkpoint branch. e.g. merge commit `e008551` to branch `docs-sync-zh`.

For more real examples, please check out [all the PRs with title "docs(zh): sync" after 2023-01-01](https://github.com/vuejs/router/pulls?q=is%3Apr+created%3A%3E2023-01-01+docs%28zh%29+sync).

### Self-host the translation

You can also host the translation on your own. To create one, just simply fork our GitHub repo and change the content and site config in `packages/docs`. To long-term maintain it, we _highly recommend_ a similar way that we do above for our officially hosted translations:

1. Ensure you create a _checkpoint branch_ (for example, a branch named sync). This branch should always align with the commit of the original documentation that corresponds to your most recent translation.
2. Utilize the diff result between the latest official repository and your own by using the git diff command or the GitHub Compare page to guide your translation.
3. Complete the translation process.
4. Update the _checkpoint branch_ accordingly.

<!-- TODO: add an example once we have got one -->

## Credits

Thank you to all the people who have already contributed to Vue Router!

<a href="https://github.com/vuejs/router/graphs/contributors"><img src="https://opencollective.com/vuejs/contributors.svg?width=890" /></a>
