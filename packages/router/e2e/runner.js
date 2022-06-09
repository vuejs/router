require('dotenv').config()
const Nightwatch = require('nightwatch')
const browserstack = require('browserstack-local')
const path = require('path')

console.log('Test', process.env.API_SECRET)

const { BROWSERSTACK_ACCESS_KEY } = process.env
if (!BROWSERSTACK_ACCESS_KEY) {
  throw new Error(
    `
(ONLY FOR MAINTAINERS)
BROWSERSTACK_ACCESS_KEY is not set. Did you create the .env file?
`
  )
}

const args = process.argv.slice(2)

// allow running browserstack local
// note this works because nighwatch doesn't use this option
const isLocal = args.indexOf('--local') > -1

const getServer =
  args.indexOf('--dev') > -1
    ? null
    : // : process.env.CI || args.indexOf('--ci') > -1
      // ? require('./staticServer')
      require('./devServer')

;(async () => {
  const server = await getServer()

  try {
    require.main.filename = path.resolve(
      __dirname,
      '../../../node_modules/.bin/nightwatch'
    )

    /** @type {import('browserstack-local').Local} */
    let bs_local
    if (isLocal) {
      // Code to start browserstack local before start of test
      console.log('Connecting local')
      bs_local = new browserstack.Local()
      Nightwatch.bs_local = bs_local

      bs_local.start(
        { key: process.env.BROWSERSTACK_ACCESS_KEY },
        async error => {
          if (error) throw error

          console.log('Connected. Now testing...')
          await runNighwatchCli().finally(() => {
            // Code to stop browserstack local after end of single test
            bs_local.stop(() => {
              server.close()
            })
          })
        }
      )
    } else {
      await runNighwatchCli()
      server.close()
    }
  } catch (ex) {
    console.log('There was an error while starting the test runner:\n\n')
    process.stderr.write(ex.stack + '\n')
    server.close()
    process.exit(2)
  }
})()

function runNighwatchCli() {
  return new Promise((resolve, reject) => {
    Nightwatch.cli(argv => {
      Nightwatch.CliRunner(argv).setup().runTests().then(resolve).catch(reject)
    })
  })
}
