// @ts-check
import { writeFile } from 'fs/promises'
import simpleGit from 'simple-git'

// Add any translation here. For each there must be at least one commit log
// like `docs(<locale>): sync update to <hash>`.
// e.g. `docs(zh): sync update to 1a3a28f`
const locales = ['zh']

// The number of commits to look back for locale checkpoints.
const MAX_LOG_COUNT = 100

// The path to the translation status file.
const STATUS_FILE_PATH = './.vitepress/translation-status.json'

const usage = `
Usage: pnpm run docs:translation-status [target-locale] [target-hash]
  target-locale: The target locale to update.
  target-hash: The target hash to update.
If neither target-locale nor target-hash are not provided, all locales will be updated.`

async function getCheckpointMap() {
  const checkpointMap = new Map()
  const git = simpleGit()
  const log = await git.log(['-n', MAX_LOG_COUNT.toString(), '--date=short'])
  if (log && log.all) {
    let localesLeft = locales.length
    log.all.some(({ date, message }) => {
      const matched = message.match(/^docs\((.+)\)\: sync update to (\w+)/)
      if (matched) {
        const locale = matched[1]
        const hash = matched[2]
        if (!checkpointMap.has(locale)) {
          checkpointMap.set(locale, {
            hash,
            // format: 'YYYY-MM-DD'
            date: new Date(date).toISOString().slice(0, 10),
          })
          localesLeft--
          if (localesLeft === 0) {
            return true
          }
        }
      }
      return false
    })
  }
  return checkpointMap
}

async function getCommitDate(hash) {
  const git = simpleGit()
  const log = await git.log(['-n', '1', '--date=short', hash])
  if (log && log.all && log.all.length) {
    return new Date(log.all[0].date).toISOString().slice(0, 10)
  }
  return ''
}

async function updateStatusFile(checkpointMap) {
  if (!checkpointMap.size) {
    console.log('❌ No checkpoint found.')
    return
  }
  const currentStatus = {}
  checkpointMap.forEach((value, key) => {
    console.log(`✅ Updated ${key} to ${value.hash}`)
    currentStatus[key] = value
  })
  await writeFile(
    STATUS_FILE_PATH,
    JSON.stringify(currentStatus, null, 2) + '\n'
  )
}

async function main() {
  if (process.argv[2] === '--help' || process.argv[2] === '-h') {
    console.log(usage)
    return
  }

  const targetLocale = process.argv[2]
  const targetHash = process.argv[3]
  let checkpointMap

  if (targetLocale && targetHash) {
    const targetDate = await getCommitDate(targetHash)
    if (targetDate === '') {
      console.log(`❌ No commit found for ${targetHash}.`)
      return
    }
    checkpointMap = new Map()
    checkpointMap.set(targetLocale, {
      hash: targetHash,
      date: targetDate,
    })
  } else {
    checkpointMap = await getCheckpointMap()
  }
  await updateStatusFile(checkpointMap)
}

main()
