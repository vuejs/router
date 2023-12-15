const fs = require('fs')
const simpleGit = require('simple-git')

// Customize the checkpoint for your translation
const locales = {
  zh: 'docs-sync-zh'
}

const getInfo = async (checkpoint) => {
  return new Promise((resolve, reject) => {
    const git = simpleGit()
    git.log(['-n', '1', '--pretty=format:"%H %cd"', '--date=short',  'origin/' + checkpoint || 'main'], (err, log) => {
      if (err) {
        reject(err)
        return
      }
      const [hash, date] = log.latest.hash.replace(/"/g, '').split(' ')
      resolve({
        hash: hash.slice(0, 7),
        date
      })
    })
  })
}

const main = async () => {
  const result = {}
  for (const lang in locales) {
    const checkpoint = locales[lang]
    result[lang] = await getInfo(checkpoint)
  }
  fs.writeFileSync('./.vitepress/translation-status.json', JSON.stringify(result, null, 2))
}

main()
