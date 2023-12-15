// @ts-check
import { readFile } from 'fs/promises'
import simpleGit from 'simple-git'

// The path to the translation status file.
const STATUS_FILE_PATH = './.vitepress/translation-status.json'

async function main() {
  const targetLocale = process.argv[2]
  if (targetLocale) {
    const currentStatus = JSON.parse(
      await readFile(STATUS_FILE_PATH, 'utf-8')
    )
    const targetHash = currentStatus[targetLocale]?.hash || ''
    if (targetHash) {
      console.log(`The last checkpoint of docs(${targetLocale}) is ${targetHash}.\n`)
      const git = simpleGit()
      const result = await git.diff([`${targetHash}..main`, 'README.md'])
      console.log(result)
    } else {
      console.log(`No docs(${targetLocale}) checkpoint found.\n`)
    }
  } else {
    console.log('Usage: node compare-to-translate.mjs <locale>')
  }
}

main()
