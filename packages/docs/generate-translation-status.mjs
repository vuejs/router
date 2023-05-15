// @ts-check
import { writeFile, readFile } from 'fs/promises'
import simpleGit from 'simple-git'

// Add any translation here. For each there must be a corresponding
// branch in the docs repo named `docs-sync-<lang>`.
const locales = ['zh']

/**
 *
 * @param {string} docsSyncBranch
 */
function getInfo(docsSyncBranch) {
  const git = simpleGit()
  return git
    .log([
      '-n',
      '1',
      '--pretty=format:"%H %cd"',
      '--date=short',
      'origin/' + docsSyncBranch || 'main',
    ])
    .then(log => {
      if (!log.latest) return null

      const [hash, date] = log.latest.hash.replace(/"/g, '').split(' ')
      return {
        hash: hash.slice(0, 7),
        date,
      }
    })
}

async function main() {
  const result = JSON.parse(
    await readFile('./.vitepress/translation-status.json', 'utf-8')
  )
  await Promise.all(
    locales.map(lang =>
      getInfo(`docs-sync-${lang}`)
        .then(data => {
          if (data) {
            result[lang] = data
            console.log(`✅ Updated ${lang} to ${data.hash}`)
          } else {
            console.log(`❌ Failed to update ${lang}`)
          }
        })
        .catch(err => {
          console.log(`❌ Unexpected Error for ${lang}`)
          console.error(err)
          return Promise.reject(err)
        })
    )
  )

  await writeFile(
    './.vitepress/translation-status.json',
    JSON.stringify(result, null, 2) + '\n'
  )
}

main()
