// @ts-check
import { writeFile, readFile } from 'fs/promises'
import simpleGit from 'simple-git'

// Add any translation here. For each there must be at least one commit log
// like `docs(<locale>): sync to #<hash>`.
// e.g. `docs(zh): sync to #1a3a28f`
const locales = ['zh']

// The number of commits to look back for locale checkpoints.
const MAX_LOG_COUNT = 100

// The path to the translation status file.
const STATUS_FILE_PATH = './.vitepress/translation-status.json'

async function getCheckpointMap() {
  const checkpointMap = new Map()
  const git = simpleGit()
  const log = await git.log(['-n', MAX_LOG_COUNT.toString(), '--date=short'])
  if (log && log.all) {
    let localesLeft = locales.length
    log.all.some(({ date, message }) => {
      // be compatible with `docs(<locale>): sync update to #<hash>`
      const matched = message.match(/^docs\((.+)\)\: sync (?:update )?to (\w+)/)
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

async function updateStatusFile(checkpointMap) {
  if (!checkpointMap.size) {
    console.log('❌ No checkpoint found.')
    return
  }
  const currentStatus = JSON.parse(
    await readFile(STATUS_FILE_PATH, 'utf-8')
  )
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
  const checkpointMap = await getCheckpointMap()
  await updateStatusFile(checkpointMap)
}

main()
