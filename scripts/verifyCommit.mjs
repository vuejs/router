// Invoked on the commit-msg git hook by simple-git-hooks.

import chalk from 'chalk'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const msgPath = path.resolve('.git/COMMIT_EDITMSG')
const msg = readFileSync(msgPath, 'utf-8').trim()

const commitRE =
  /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(\(.+\))?: .{1,50}/

if (!commitRE.test(msg)) {
  console.log()
  console.error(
    `  ${chalk.bgRed.white(' ERROR ')} ${chalk.red(
      `invalid commit message format.`
    )}\n\n` +
      chalk.red(
        `  Proper commit message format is required for automated changelog generation. Examples:\n\n`
      ) +
      `    ${chalk.green(
        `fix(view): handle keep-alive with aborted navigations`
      )}\n` +
      `    ${chalk.green(
        `fix(view): handle keep-alive with aborted navigations (close #28)`
      )}\n\n` +
      chalk.red(`  See .github/commit-convention.md for more details.\n`)
  )
  process.exit(1)
}
