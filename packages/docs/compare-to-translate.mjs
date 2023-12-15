// @ts-check
import simpleGit from 'simple-git'

// The number of commits to look back for locale checkpoints.
const MAX_LOG_COUNT = 100

const usage = `
Usage: pnpm run docs:compare-to-translate <locale> [target-branch]
  locale: The locale to compare.
  target-branch: The target branch to compare. Default to 'main'.`

async function getTargetHashByGit(targetLocale) {
  const git = simpleGit()
  const log = await git.log(['-n', MAX_LOG_COUNT.toString()])
  let targetHash = ''
  if (log && log.all) {
    log.all.some(({ message }) => {
      const matched = message.match(/^docs\((.+)\)\: sync update to (\w+)/)
      if (matched) {
        const locale = matched[1]
        const hash = matched[2]
        if (locale === targetLocale) {
          targetHash = hash
          return true
        }
      }
      return false
    })
  }
  return targetHash
}

async function main() {
  if (!process.argv[2] || process.argv[2] === '--help' || process.argv[2] === '-h') {
    console.log(usage)
    return
  }

  const targetLocale = process.argv[2]
  const targetBranch = process.argv[3] || 'main'

  const targetHash = await getTargetHashByGit(targetLocale)
  if (targetHash) {
    console.log(`The last checkpoint of docs(${targetLocale}) is ${targetHash}.\n`)
    const git = simpleGit()
    const result = await git.diff([`${targetHash}..${targetBranch}`, '.'])
    console.log(result)
  } else {
    console.log(`No docs(${targetLocale}) checkpoint found.\n`)
  }
}

main()
